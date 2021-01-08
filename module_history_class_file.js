
const fs = require("fs");
const bytewise_hex = require("bytewise/hex");

const util = require('util');
const HistoryGlobal = require("./module_history_global.js");

const levelup = require("levelup");
const leveldown = require("leveldown");

var dbdir = "./.level_db/";

function makeKey(version) {
	if (typeof version !== "number") return undefined;
	var buffer = Buffer.allocUnsafe(8);
	buffer.writeDoubleBE(version, 0);
	var bytes = [0x41];
	for (var i = 0, end = buffer.length; i < end; ++i) {
		bytes.push(~buffer.readUInt8(i));
	}
	var b = Buffer.from(bytes);
	return "\xff" + b.toString("hex");
}

function unmakeKey(key) {
	var chunk = Buffer.from(key.toString().substring(3), "hex");
	var bytes = [];
	for (var i = 0, end = chunk.length; i < end; ++i) {
		bytes.push(~chunk.readUInt8(i));
	}
	var buffer = Buffer.from(bytes);

	return buffer.readDoubleBE(0);
}

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
	ldb.on("ready", function() {
		console.log("vdb opened:", dbname);
		if (typeof callback === "function") {
			callback();
		}
	});
	return ldb;
};

var vdb_read = function(vdb, config, callback) {
	var hdata = [];
	var options = {
		limit: config.maxentries,
		reverse: config.reverse_align,
	};
	if (typeof config.fromtime === "number") {
		options.lt = makeKey(config.fromtime);
	}
	if (typeof config.totime === "number") {
		options.gt = makeKey(config.totime);
	}
	vdb.createReadStream(options)
	.on('data', function (data) {
		var time = unmakeKey(data.key);
		var value = null;
		if (data.value !== "")
			value = parseFloat(data.value);

		hdata.push({"time": time, "value": value});
	})
	.on('error', function (err) {
		console.warn('Error from getting history:',err);
		callback(null);
	})
	.on('end', function() {
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
	if (value === null || typeof value === "undefined") {
		value = "";
	}

	this.vdb.put(makeKey(time), value, function(err) {
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
