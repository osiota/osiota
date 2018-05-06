
const fs = require("fs");

var util = require('util');
var HistoryGlobal = require("./module_history_global.js");

var levelup = require("levelup");
var leveldown = require("leveldown");
var version = require("level-version");

var dbdir = "./.level_db/";

var vdb_setup = function(node, config, callback) {
	var dbdir_local = dbdir;
	if (typeof config.dbdir === "string") {
		dbdir_local = config.dbdir.replace(/\/$/, "") + "/";
	}
	try {
		fs.mkdirSync(dbdir_local);
	} catch(e) {}
	console.log("vdb_setup", node.name);
	var dbname = node.name+"/" + config.filename;
	dbname = dbname.replace(/^\/+/,"").replace(/[\/@]/g, "_");
	dbname = dbdir_local + dbname;

	console.log("filename", dbname);
	var ldb = levelup(leveldown(dbname));
	var vdb = version(ldb);
	ldb.on("ready", function() {
		console.log("vdb opened:", node.name);
		if (typeof callback === "function") {
			callback();
		}
	});
	return vdb;
};

var vdb_read = function(vdb, config, callback) {
	var hdata = [];
	vdb.createVersionStream("", {
		//versionLimit: config.maxentries,
		limit: config.maxentries,
		reverse: config.reverse_align,
		minVersion: config.fromtime,
		maxVersion: config.totime
	})
	.on('data', function (data) {
		var value;
		if (data.value === "")
			value = null;
		else
			value = parseFloat(data.value);

		hdata.push({"time": data.version, "value": value});
	})
	.on('error', function (err) {
		console.warn('Error from getting history:',err);
		callback(null);
	})
	.on('end', function() {
		// from and to time not included: Remove them:
		if (config.fromtime != null)
			hdata.shift();
		if (config.totime != null)
			hdata.pop();
		if (!config.reverse_align)
			hdata.reverse();
		callback(hdata);
	});
}

exports.history = function (node, config) {
	console.log("node, file", node.name);

	if (typeof node.metadata === "object" &&
			node.metadata !== null &&
			typeof node.metadata.history !== "undefined") {
		if (node.metadata.history === false) {
			throw new Error("Module disabled.");
		}
	}

	this.vdb = vdb_setup(node, config);
};
util.inherits(exports.history, HistoryGlobal.history);

exports.history.prototype.add = function (time, value) {
	if (time === null) {
		return;
	}

	this.vdb.put("", value, {version: time}, function(err, version) {
		if(err)
			console.warn('Error:', err);
	});
};

//remote getting history
exports.history.prototype.get = function (parameters, callback) {
	var config = {};
	config.maxentries = 3000;
	config.fromtime = null; // not included
	config.totime = null; // not included.
	config.reverse_align = false;

	// read config from parameters object
	if (typeof parameters !== "object") {
		parameters = {};
	}
	if (typeof parameters.maxentries === "number") {
		config.maxentries = parameters.maxentries;
	}
	if (typeof parameters.fromtime === "number") {
		config.fromtime = parameters.fromtime;
	}
	if (typeof parameters.totime === "number") {
		config.totime = parameters.totime;
	}
	if (typeof parameters.reverse_align === "boolean") {
		config.reverse_align = parameters.reverse_align;
	}
	if (config.maxentries === -1) {
		config.maxentries = null;
	}

	// correct max entries (from and to time not included)
	if (config.maxentries !== null) {
		if (config.fromtime !== null)
			config.maxentries++;
		if (config.totime !== null)
			config.maxentries++;
	}

	// search version db
	vdb_read(this.vdb, config, function(hdata) {
		if (hdata === null) {
			callback(hdata, true);
		} else {
			callback(hdata, false);
		}
	});
};

exports.vdb_setup = vdb_setup;

HistoryGlobal.modules.file = exports.history;
