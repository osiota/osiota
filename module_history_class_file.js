
const fs = require("fs");

const HistoryGlobal = require("./module_history_global.js");

const levelup = require("levelup");
const leveldown = require("leveldown");

const dbdir = "./.level_db/";

function makeKey(version) {
	if (typeof version !== "number") return undefined;
	const buffer = Buffer.allocUnsafe(8);
	buffer.writeDoubleBE(version, 0);
	const bytes = [0x41];
	for (let i = 0, end = buffer.length; i < end; ++i) {
		bytes.push(~buffer.readUInt8(i));
	}
	const b = Buffer.from(bytes);
	return "\xff" + b.toString("hex");
}

function unmakeKey(key) {
	const chunk = Buffer.from(key.toString().substring(3), "hex");
	const bytes = [];
	for (let i = 0, end = chunk.length; i < end; ++i) {
		bytes.push(~chunk.readUInt8(i));
	}
	const buffer = Buffer.from(bytes);

	return buffer.readDoubleBE(0);
}

const vdb_setup = function(node, config, callback) {
	let dbdir_local = dbdir;
	if (typeof config.dbdir === "string") {
		dbdir_local = config.dbdir.replace(/\/$/, "") + "/";
	}
	try {
		fs.mkdirSync(dbdir_local);
	} catch(e) {}
	console.log("vdb_setup", node.name);
	let dbname = node.name+"/" + config.filename;
	dbname = dbname.replace(/^\/+/,"").replace(/[\/@]/g, "_");
	dbname = dbdir_local + dbname;

	const ldb = levelup(leveldown(dbname));
	ldb.on("ready", function() {
		console.log("vdb opened:", dbname);
		if (typeof callback === "function") {
			callback();
		}
	});
	return ldb;
};

const vdb_read = function(vdb, config, callback) {
	const hdata = [];
	const options = {
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
		const time = unmakeKey(data.key);
		let value = null;
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

class history extends HistoryGlobal.history {
	constructor(node, config) {
		super(node, config);
		if (typeof node.metadata === "object" &&
				node.metadata !== null &&
				typeof node.metadata.history !== "undefined") {
			if (node.metadata.history === false) {
				throw new Error("Module disabled.");
			}
		}

		this.vdb = vdb_setup(node, config);
	};

	add(time, value) {
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
	get(parameters, callback) {
		const config = {};
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
};
exports.history = history;

exports.vdb_setup = vdb_setup;

HistoryGlobal.modules.file = exports.history;
