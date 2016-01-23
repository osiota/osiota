var levelUP = require("levelUP");
var version = require("level-version");

exports.history = function (nodeName, history_config) {
	var dbName = nodeName.replace("/", "");
	this.original = levelUP('./level_db/' + dbName);
	this.original_second = levelUP('./level_db/' + dbName + '/second');
	this.original_minute = levelUP('./level_db/' + dbName + '/minute');
	this.original_hour = levelUP('./level_db/' + dbName + '/hour');
	this.db = version(this.original);
	this.db_second = version(this.original_second);
	this.db_minute = version(this.original_minute);
	this.db_hour = version(this.original_hour);
	this.lastSecond = {};
	this.lastMinute = {};
	this.lastHour = {};
	this.newTime = {};
	this.nodeName = nodeName;
};

exports.history.prototype.add = function (time, value) {
	var _this = this;
	var nodeName = this.nodeName;
	var milliseconds = new Date(time).getTime();
	var json = {"time":time, "value":value};

	//save data without interval
	this.db.put(nodeName, JSON.stringify(json), function (err, version) {
		if(err) return console.log('Error:', err);
	});

	//save data with one second interval
	_this.newTime[nodeName] = milliseconds;
	if(typeof _this.lastSecond[nodeName] === "undefined")
		_this.lastSecond[nodeName] = _this.newTime[nodeName];
	if(Math.floor((_this.newTime[nodeName] - _this.lastSecond[nodeName]) / 1000) == 1)
	{
		_this.lastSecond[nodeName] = _this.newTime[nodeName];
		this.db_second.put(nodeName + '_second', JSON.stringify(json), function (err, version) {
			if(err) return console.log('Error:', err);
		});
	}

	//save data with one minute interval
	if(typeof _this.lastMinute[nodeName] === "undefined")
		_this.lastMinute[nodeName] = _this.newTime[nodeName];
	if(Math.floor((_this.newTime[nodeName] - _this.lastMinute[nodeName]) / 60000) == 1)
	{
		_this.lastMinute[nodeName] = _this.newTime[nodeName];
		this.db_minute.put(nodeName + '_minute', JSON.stringify(json), function (err, version) {
			if(err) return console.log('Error:', err);
		});
	}

	//save data with one hour interval
	if(typeof _this.lastHour[nodeName] === "undefined")
		_this.lastHour[nodeName] = _this.newTime[nodeName];
	if(Math.floor((_this.newTime[nodeName] - _this.lastHour[nodeName]) / 3600000) == 1)
	{
		_this.lasthour[nodeName] = _this.newTime[nodeName];
		this.db_hour.put(nodeName + '_hour', JSON.stringify(json), function (err, version) {
			if(err) return console.log('Error:', err);
		});
	}
};

//local getting history
/*exports.history.prototype.get = function () {
	var _this = this;
	this.db.get(this.nodeName, function (err, value, version) {
		if(err) return console.log('Error:', err);
		var data = JSON.parse(value);
		console.log(version, _this.nodeName, data.time, data.value);
	});
};*/

//remote getting history
exports.history.prototype.get = function (interval, callback) {
	var nodeName = this.nodeName;

	//get all history
	if(interval == 0)
	{
		var hdata = [];
		this.db.createVersionStream(nodeName)
		.on('data', function (data) {
			var json = JSON.parse(data.value);
			hdata.unshift(json);
		})
		.on('error', function (err) {
			console.log('Error from getting history:',err);
		})
		.on('close', function () {
			console.log('Getting history stream without interval closed.');
		})
		.on('end', function() {
			console.log('Getting history stream without interval closed');
			callback(hdata);
		});
	}

	//get history with interval one second
	if(interval == 1)
	{
		var hdata = [];
		this.db_second.createVersionStream(nodeName + '_second')
		.on('data', function (data) {
			var json = JSON.parse(data.value);
			hdata.unshift(json);
		})
		.on('error', function (err) {
			console.log('Error from getting history:',err);
		})
		.on('close', function () {
			console.log('Getting history stream with one second interval closed.');
		})
		.on('end', function() {
			console.log('Getting history stream with one second interval closed');
			callback(hdata);
		});
	}

	//get history with interval one minute
	if(interval == 60)
	{
		this.db_minute.createVersionStream(nodeName + '_minute')
		.on('data', function (data) {
			var json = JSON.parse(data.value);
			callback({"type":"history", "interval":"interval: one minute", "node":nodeName, "version":data.version, "time":json.time, "value":json.value});
		})
		.on('error', function (err) {
			console.log('Error from getting history:',err);
		})
		.on('close', function () {
			console.log('Getting history stream with one minute interval closed.');
		})
		.on('end', function() {
			console.log('Getting history stream with one minute interval closed');
		});
	}

	//get history with interval one hour
	if(interval == 3600)
	{
		this.db_hour.createVersionStream(nodeName + '_hour')
		.on('data', function (data) {
			var json = JSON.parse(data.value);
			callback({"type":"history", "interval":"interval: one hour", "node":nodeName, "version":data.version, "time":json.time, "value":json.value});
		})
		.on('error', function (err) {
			console.log('Error from getting history:',err);
		})
		.on('close', function () {
			console.log('Getting history stream with one hour interval closed.');
		})
		.on('end', function() {
			console.log('Getting history stream with one hour interval closed');
		});
	}
}

