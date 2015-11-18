"use strict";

(function(exports){

	// from https://github.com/darkskyapp/binary-search
	var binarysearch = function(haystack, needle, comparator, low, high) {
		var mid, cmp;

		if(low === undefined)
			low = 0;

		else {
			low = low|0;
			if(low < 0 || low >= haystack.length)
				throw new RangeError("invalid lower bound");
		}

		if(high === undefined)
			high = haystack.length - 1;

		else {
			high = high|0;
			if(high < low || high >= haystack.length)
				throw new RangeError("invalid upper bound");
		}

		while(low <= high) {
			/* Note that "(low + high) >>> 1" may overflow, and results in a typecast
			* to double (which gives the wrong results). */
			mid = low + (high - low >> 1);
			cmp = +comparator(haystack[mid], needle);

			/* Too low. */
			if(cmp < 0.0) 
				low  = mid + 1;

			/* Too high. */
		else if(cmp > 0.0)
			high = mid - 1;

		/* Key found. */
	else
		return mid;
		}

		/* Key not found. */
		return ~low;
	};


	/* history */
	exports.history = function(history_length) {
		this.history_length = history_length;
		this.history_data = [];
	};
	/* history: add new data */
	exports.history.prototype.add = function(time, value) {
		this.history_data.push({"time": time, "value": value});
		if (this.history_data.length > this.history_length) {
			this.history_data.splice(0,1);  // remove the first element of the array
		}
	};
	/* history: get old data */
	exports.history.prototype.get = function(interval) {
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


})(typeof exports === 'undefined'? this['module_history']={}: exports);

