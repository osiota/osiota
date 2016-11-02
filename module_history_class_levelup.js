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

exports.history = function (nodeName, history_config) {
	var _this = this;
	this.nodeName = nodeName;
	this.timebases = [];
	levelUP('./level_db' + nodeName);
	for (var t = 0; t < history_config.timebases.length; t++) {
		this.timebases[t] = [];
		this.timebases[t].filename = history_config.timebases[t].filename;
		this.timebases[t].delta_t = history_config.timebases[t].delta_t;

		var ldb = levelUP('./level_db' + nodeName + '/' + this.timebases[t].filename);
		var vdb = version(ldb);
		this.timebases[t].vdb = vdb;
		
		(function(vdb, t) {
			_this.timebases[t].add = helper_change_timebase(_this.timebases[t].delta_t, function(time, value) {
				vdb.put(nodeName, value, {version: time}, function (err, version) {
					if(err) return console.log('Error:', err);
				});
			});
		})(vdb, t);
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
		console.log('Error from getting history:',err);
	})
	.on('close', function () {
		console.log('Getting history stream closed.');
	})
	.on('end', function() {
		// from and to time not included: Remove them:
		if (config.fromtime != null)
			hdata.shift();
		if (config.totime != null)
			hdata.pop();
		callback(hdata);
	});
};
