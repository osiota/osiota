var levelUP = require("levelUP");
var version = require("level-version");

var helper_change_timebase = function (interval, callback) {
	var sum = 0;
	var count = 0;
	var lastTimeSlot = 0;

	return function(time, value) {
		if (interval == 0) {
			callback(time, value, interval);
		}
		else {
			if (typeof sum === "undefined" && typeof count === "undefined") {
				sum = 0;
				count = 0;
			}
			var thisTimeSlot = Math.floor(time / interval) * interval;
			if (thisTimeSlot != lastTimeSlot) {
				if (count != 0) {
					var newValue = sum / count;
					var newTime = lastTimeSlot + interval;
					callback(newTime, newValue, interval);
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
	console.log("new History: ", history_config)
	this.nodeName = nodeName;
	this.timebases = [];
	levelUP('./level_db' + nodeName);
	for (var t = 0; t < history_config.timebases.length; t++) {
		this.timebases[t] = [];
		this.timebases[t].filename = history_config.timebases[t].filename;
		this.timebases[t].filename = history_config.timebases[t].filename;
		this.timebases[t].delta_t = history_config.timebases[t].delta_t;

		var ldb = levelUP('./level_db' + nodeName + '/' + this.timebases[t].filename);
		var vdb = version(ldb);
		this.timebases[t].vdb = vdb;
		
		(function(vdb, t) {
			_this.timebases[t].add = helper_change_timebase(_this.timebases[t].delta_t, function(time, value) {
				if (_this.timebases[t].delta_t != 0)
				console.log("put", _this.timebases[t].delta_t, nodeName, time, value);
				vdb.put(nodeName, value, {version: time}, function (err, version) {
					if(err) return console.log('Error:', err);
				});
			});
		})(vdb, t);
	}
	this.maxCount = history_config.maxCount;
};

exports.history.prototype.add = function (time, value) {
	var nodeName = this.nodeName;
//	console.log("add", nodeName, time, value)
	this.timebases.forEach(function(d) {
		d.add(time, value);
	});
};

//remote getting history
exports.history.prototype.get = function (interval, callback) {
	var nodeName = this.nodeName;
	var hdata = [];

	var vdb;
	this.timebases.forEach(function(d) {
		if (d.delta_t == interval)
			vdb = d.vdb;
	});
	if (typeof vdb === "undefined")
		return;
	vdb.createVersionStream(nodeName)
	.on('data', function (data) {
		var json = {"time":data.version, "value":data.value};
		hdata.push(json);
	})
	.on('error', function (err) {
		console.log('Error from getting history:',err);
	})
	.on('close', function () {
		console.log('Getting history stream closed.');
	})
	.on('end', function() {
		callback(hdata);
		console.log('Getting history stream with ' + interval + 's interval ended.');
	});
};

/*exports.history.prototype.change_timebase = function (hdata, interval, callback) {
	var hdataTemp = [];
	var hct = helper_change_timebase(interval, function() {
		hdataTemp.push({
			"time": time,
			"value": value
		});
	});
	hdata.forEach(function(d) {
		hct(d.time, d.value);
	});
	return hdataTemp;
};*/

