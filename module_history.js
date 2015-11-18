"use strict";

(function(history){

	var binarysearch = require("binary-search");

	/* history */
	history = function(history_length) {
		this.history_length = history_length;
		this.history_data = [];
	};
	/* history: add new data */
	history.prototype.add = function(time, value) {
		this.history_data.push({"time": time, "value": value});
		if (this.history_data.length > this.history_length) {
			this.history_data.splice(0,1);  // remove the first element of the array
		}
	};
	/* history: get old data */
	history.prototype.get = function(interval) {
		var config = {};
		config.maxentries = 3000;
		config.samplerate = null;
		config.fromtime = null;
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
		var data = this.history_data;
		if (config.fromtime !== null) {
			var index = Math.abs(
				binarysearch(data, config.fromtime, function(a, b) { return a.time - b.time; })
			);
			data = data.slice(index);
		}
		if (config.totime !== null) {
			var index = Math.abs(
				binarysearch(data, {"time": config.totime}, function(a, b) { return a.time - b.time; })
			);
			data = data.slice(0,index);
		}
		data = data.slice(Math.max(data.length - config.maxentries, 0));
		return data;
	}


})(typeof exports === 'undefined'? this['history']={}: exports);

