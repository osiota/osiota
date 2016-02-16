
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
exports.history = function(nodename, history_config) {
	this.history_length = 3000;
	if (typeof history_config === "object" &&
			history_config.hasOwnProperty("max_data") &&
			typeof history_config.max_data === "number") {
		this.history_length = history_config.max_data;
	}
	this.history_data = [];
};
/* history: add new data */
exports.history.prototype.add = function(time, value) {
	if (typeof this.history_data[this.history_data.length - 1] !== "undefined")
		// last added history data
		var lasttime = this.history_data[this.history_data.length - 1].time;
	else
		var lasttime = 0;
	if (time === lasttime)
		return;
	if (time > lasttime) {
		// new data IS newser. Data not in history. Add it:
		this.history_data.push({"time": time, "value": value});
	} else {
		// wrong order. We need to sort in this new key ...
		var data = this.history_data; 
		var index = binarysearch(data, {"time": time},
				function(a, b) { return a.time - b.time; });

		if (index < 0) {
			// element not found:
			index = ~index;

			// insert element at index
			this.history_data.splice(index, 0, {"time": time, "value": value});
		}// else: element found. No action.

	}

	// remove data longer than history_length
	if (this.history_data.length > this.history_length) {
		// remove the first (oldest) element of the array
		this.history_data.splice(0,1);
	}
};
/* history: get old data */
exports.history.prototype.get = function(interval, callback) {
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
	var data = this.history_data;
	if (config.fromtime !== null) {
		// find start index:
		var index = binarysearch(data, {"time": config.fromtime},
				function(a, b) { return a.time - b.time; });
		// if time was not found, index is bitwise flipped.
		if (index < 0) index = ~index;
		// do not include the element itself:
		else index = index + 1;

		// from start index (included) to end:
		data = data.slice(index);
	}
	if (config.totime !== null) {
		// find end index:
		var index = binarysearch(data, {"time": config.totime},
				function(a, b) { return a.time - b.time; });
		// if time was not found, index is bitwise flipped.
		if (index < 0) index = ~index;

		// from zero to end index (not included):
		data = data.slice(0,index-1);
	}
	data = data.slice(Math.max(data.length - config.maxentries, 0));

	// return data:
	callback(data);
}


