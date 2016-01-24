var levelUP = require("levelUP");
var version = require("level-version");

exports.history = function (nodeName, history_config) {
	var dbName = nodeName.replace("/", "");
	this.original = levelUP('./level_db/' + dbName);
	this.db = version(this.original);
	this.nodeName = nodeName;
	this.maxCount = history_config.maxCount;
};

exports.history.prototype.add = function (time, value) {
	var nodeName = this.nodeName;
	var json = {"time":time, "value":value};

	//save data without interval
	this.db.put(nodeName, JSON.stringify(json), function (err, version) {
		if(err) return console.log('Error:', err);
	});
};

//remote getting history
exports.history.prototype.get = function (interval, callback) {
	var _this = this;
	var nodeName = this.nodeName;
	var lastTime;
	var newTime;
	var newValue;
	var sum;
	var count;
	var globalCount;
	var hdata = [];
	var hdataTemp = [];

	this.db.createVersionStream(nodeName)
	.on('data', function (data) {
		var json = JSON.parse(data.value);
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
		else
		{
			if(typeof lastTime === "undefined")
			{
				lastTime = hdata[hdata.length - 2].time*1000;
				sum = 0;
				count = 0;
			}
			for(var i = hdata.length - 2; i >= 0; i--)
			{
				newTime = hdata[i].time*1000;
				//to check, if time of history data is continuously
				if(hdata[i+1].time*1000 - newTime < 1000)
				{
					if(Math.floor((lastTime - newTime) / (interval*1000)) == 1)
					{
						lastTime = newTime;
						newValue = sum / count;
						sum = 0;
						count = 0;
						var newJson = {"time":hdata[i].time, "value":newValue};
						hdataTemp.unshift(newJson);
					} 
					else 
					{
						sum += hdata[i].value;
						count ++;
						globalCount ++;
						if(globalCount >= _this.maxCount)
							break;
					}
				} 
				else
					lastTime = newTime;
			}
			callback(hdataTemp);
		}
		console.log('Getting history stream with ' + interval + 's interval ended.');
	});
}

