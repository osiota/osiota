var levelUP = require("levelUP");
var version = require("level-version");

/*version.prototype.add = function(nodeName, time, value) {
	this.put(nodeName, value, {version: time}, function (err, version) {
		if(err) return console.log('Error:', err);
	});
};*/

var helper_change_timebase = function (interval, callback) {
	var sum = 0;
	var count = 0;
	var lastTimeSlot = 0;

	return function(nodeName, time, value) {
		if (interval == 0) {
			callback(nodeName, time, value, interval);
		}
		else {
			var thisTimeSlot = Math.floor(time / interval) * interval;
			if (thisTimeSlot != lastTimeSlot) {
				if (count != 0) {
					var newValue = sum / count;
					var newTime = lastTimeSlot + interval;
					callback(nodeName, newTime, newValue, interval);
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
	this.timebases = history_config.timebases;
//	this.timebases = {};
//	this.timebases[nodeName] = history_config.timebases;
	levelUP('./level_db' + nodeName);
/*	for (var t = 0; t < this.timebases.length; t++) {
		var ldb = levelUP('./level_db' + nodeName + '/' + this.timebases[t].filename);
		var vdb = version(ldb);
		this.timebases[t].vdb = vdb;
		
		this.timebases[t].put = helper_change_timebase(this.timebases[t].delta_t, function(nodeName, time, value) {
//			vdb.add(nodeName, time, value);
			vdb.put(nodeName, value, {version: time}, function (err, version) {
				if(err) return console.log('Error:', err);
			});
		});
	};*/
	for (var t = 0; t < this.timebases.length; t++) {
		this.timebases[t].ldb = levelUP('./level_db' + nodeName + '/' + this.timebases[t].filename);
		this.timebases[t].vdb = version(this.timebases[t].ldb);
		
		this.timebases[t].put = helper_change_timebase(this.timebases[t].delta_t, function(nodeName, time, value, interval) {
			if (interval == 0) {
				_this.timebases[0].vdb.put(nodeName, value, {version: time}, function (err, version) {
					if(err) return console.log('Error:', err);
				});
			}
			else if (interval == 1) {
				_this.timebases[1].vdb.put(nodeName, value, {version: time}, function (err, version) {
					if(err) return console.log('Error:', err);
					console.log(nodeName)
				});
			}
			else if (interval == 60) {
				_this.timebases[2].vdb.put(nodeName, value, {version: time}, function (err, version) {
					if(err) return console.log('Error:', err);
				});
			}
			else if (interval == 60*60) {
				_this.timebases[3].vdb.put(nodeName, value, {version: time}, function (err, version) {
					if(err) return console.log('Error:', err);
				});
			}
			else {
				console.log("Error(save data to database): System doesn't have database with " + interval + " interval.");
			}
		});
	};
	this.maxCount = history_config.maxCount;
};

exports.history.prototype.add = function (time, value) {
	var nodeName = this.nodeName;
	this.timebases.forEach(function(d) {
		d.put(nodeName, time, value);
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

