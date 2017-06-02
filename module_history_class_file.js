
const fs = require("fs");

var util = require('util');
var HistoryGlobal = require("./module_history_global.js");

var levelUP = require("levelup");
var version = require("level-version");

var vdb_setup = function(node, config) {
	try {
		fs.mkdirSync("./.level_db/");
	} catch(e) {}
	console.log("vdb_setup", node.name);
	var dbname = node.name+"/";
	dbname = dbname.replace(/^\/+/,"").replace(/[\/@]/, "_");

	console.log("filename", './.level_db/' + dbname + config.filename);
	var ldb = levelUP('./.level_db/' + dbname + config.filename);
	var vdb = version(ldb);
	return vdb;
};

var vdb_read = function(vdb, config, node_name, callback) {
	var hdata = [];
	vdb.createVersionStream(node_name, {
		versionLimit: config.maxentries,
		minVersion: config.fromtime,
		maxVersion: config.totime
	})
	.on('data', function (data) {
		var json = {"time":data.version, "value":data.value};
		hdata.unshift(json);
	})
	.on('error', function (err) {
		console.warn('Error from getting history:',err);
		callback(null);
	})
	.on('close', function () {
		console.warn('Getting history stream closed.');
	})
	.on('end', function() {
		// from and to time not included: Remove them:
		if (config.fromtime != null)
			hdata.shift();
		if (config.totime != null)
			hdata.pop();
		callback(hdata);
	});
}

exports.history = function (node, config) {
	console.log("node, file", node.name);
	this.node_name = node.name;

	this.vdb = vdb_setup(node, config);
};
util.inherits(exports.history, HistoryGlobal.history);

exports.history.prototype.add = function (time, value) {
	if (time === null) {
		return;
	}

	this.vdb.put(this.node_name, value, {version: time}, function(err, version) {
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

	// correct max entries (from and to time not included)
	if (config.maxentries !== null) {
		if (config.fromtime !== null)
			config.maxentries++;
		if (config.totime !== null)
			config.maxentries++;
	}

	// search version db
	vdb_read(this.vdb, config, this.node_name, function(hdata) {
		if (hdata === null) {
			callback(hdata, true);
		} else {
			callback(hdata, false);
		}
	});
};

HistoryGlobal.modules.file = exports.history;
