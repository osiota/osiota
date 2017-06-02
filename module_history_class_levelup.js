var levelUP = require("levelUP");
var version = require("level-version");

var helper_change_timebase = function (interval, callback) {
	var sum = 0;
	var count = 0;
	var lastTimeSlot = 0;

	return function(time, value) {
		if (interval == 0) {
			callback(time, value);
		}
		else {
			var thisTimeSlot = Math.floor(time / interval) * interval;
			if (thisTimeSlot != lastTimeSlot) {
				if (count != 0) {
					var newValue = sum / count;
					var newTime = lastTimeSlot + interval;
					callback(newTime, newValue);
				}

				sum = 0;
				count = 0;

				lastTimeSlot = thisTimeSlot;
			}
			sum += value;
			count ++;
		}
	};
}

var setup_lu = function(t, config, nodeName) {
	var to = [];
	to.filename = config.filename;
	to.delta_t = config.delta_t;

	var ldb = levelUP('./.level_db' + nodeName + '/' + to.filename);
	var vdb = version(ldb);
	to.vdb = vdb;

	to.add = helper_change_timebase(to.delta_t, function(time, value) {
		vdb.put(nodeName, value, {version: time},
				function (err, version) {
			if(err) return console.warn('Error:', err);
		});
	});

	return to;
};

var read_lu = function(vdb, config, callback) {
	var hdata = [];
	vdb.createVersionStream(this.nodeName, {
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

exports.history = function (node, history_config) {
	var _this = this;
	var nodeName = node.name;
	this.nodeName = nodeName;
	this.timebases = [];
	levelUP('./.level_db' + nodeName);
	for (var t = 0; t < history_config.timebases.length; t++) {
		this.timebases[t] = setup_lu(t, history_config.timebases[t],
				nodeName);
	}
};

exports.history.prototype.add = function (time, value) {
	if (time === null) {
		return;
	}
	this.timebases.forEach(function(d) {
		d.add(time, value);
	});
};

//remote getting history
exports.history.prototype.get = function (interval, callback) {
	var config = {};
	config.maxentries = 3000;
	config.interval = null;
	config.fromtime = null; // not included
	config.totime = null; // not included.

	// read config from interval object
	if (typeof interval !== "object") {
		interval = {};
	}
	for (var configname in config) {
		if (interval.hasOwnProperty(configname) &&
				typeof interval[configname] === "number") {
			config[configname] = interval[configname];
		}
	}

	// correct max entries (from and to time not included)
	if (config.maxentries != null) {
		if (config.fromtime != null)
			config.maxentries++;
		if (config.totime != null)
			config.maxentries++;
	}

	// search version db
	var vdb;
	this.timebases.forEach(function(d) {
		if (d.delta_t == config.interval)
			vdb = d.vdb;
	});
	if (typeof vdb === "undefined")
		return;

	read_lu(vdb, config, function(hdata) {
		callback(hdata, false);
	});
};
