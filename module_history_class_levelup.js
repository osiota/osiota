var levelUP = require("levelUP");
var version = require("level-version");

exports.history = function (nodeName, history_config) {
	var _this = this;
	this.nodeName = nodeName;
	var dbName = nodeName.replace("/", "");
	this.timebases = history_config.timebases;
	this.original = {};
	this.db = {};
	this.timebases.forEach (function(d) {
		_this.original[d.delta_t] = levelUP('./level_db/' + dbName + '/' + d.filename);
		_this.db[d.delta_t] = version(_this.original[d.delta_t]);
	});
	this.maxCount = history_config.maxCount;
};

exports.history.prototype.add = function (time, value) {
	var nodeName = this.nodeName;

	//save data without interval
	this.db[0].put(nodeName, value, {version: time}, function (err, version) {
		if(err) return console.log('Error:', err);
	});
};

//remote getting history
exports.history.prototype.get = function (interval, callback) {
	var _this = this;
	var nodeName = this.nodeName;
	var hdata = [];

	this.db[0].createVersionStream(nodeName)
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
		if(interval == 0)
			callback(hdata);
		else {
			var hdataTemp = _this.change_timebase(hdata, interval);
			callback(hdataTemp);
		}
		console.log('Getting history stream with ' + interval + 's interval ended.');
	});
};

exports.history.prototype.change_timebase = function (hdata, interval) {
	var hdataTemp = [];

	var lastTime = Math.floor(hdata[0].time / interval);
	var sum = 0;
	var count = 0;

	if (interval > 0) {
		for (var i = 0; i < hdata.length; i++) {
			//first value
			if (i == 0) {
				sum += parseInt(hdata[i].value);
				count ++;
			}
			//time is continuous
			else if (hdata[i].time - hdata[i-1].time < 1) {
				if (Math.floor(hdata[i].time / interval) == lastTime) {
					sum += parseInt(hdata[i].value);
					count ++;
				} 
				else {
					sum += parseInt(hdata[i].value);
					count ++;
					var newValue = sum / count;
					sum = 0;
					count = 0;
					var newJson = {"time":hdata[i].time, "value":newValue};
					hdataTemp.unshift(newJson);
					lastTime = Math.floor(hdata[i].time / interval)
				}
			//time is not continuous
			} else {
				sum += parseInt(hdata[i].value);
				count ++;
				var newValue = sum / count;
				sum = 0;
				count = 0;
				var time = lastTime + interval;
				var newJson = {"time":time, "value":newValue};
				hdataTemp.unshift(newJson);
				lastTime = Math.floor(hdata[i].time / interval)
			} 
		}

		return hdataTemp;
	}
}

