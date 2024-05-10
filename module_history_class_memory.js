
const HistoryGlobal = require("./module_history_global.js");
const binarysearch = require("binary-search");

/* history */
class history extends HistoryGlobal.history {
	constructor(node, config) {
		super(node, config);
		console.log("INIT INIT INIT", node.name);
		this.history_length = 3000;
		if (typeof config === "object" &&
				config.hasOwnProperty("max_data") &&
				typeof config.max_data === "number") {
			this.history_length = config.max_data;
		}
		this.history_data = [];
	};

	/* history: add new data */
	add(time, value) {
		console.log("ADD", time, value);
		if (typeof this.history_data[this.history_data.length - 1] !== "undefined")
			// last added history data
			var lasttime = this.history_data[this.history_data.length - 1].time;
		else
			var lasttime = 0;
		if (time === null)
			return;
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
	get(parameters, callback) {
		var config = {};
		config.maxentries = 3000;
		config.interval = null;
		config.fromtime = null; // not included
		config.totime = null; // not included.
		config.reverse_align = false;

		var limited = false;

		// read config from parameters object
		if (typeof parameters !== "object") {
			parameters = {};
		}
		if (typeof parameters.maxentries === "number") {
			config.maxentries = parameters.maxentries;
		}
		if (typeof parameters.fromtime === "number") {
			config.fromtime = parameters.fromtime;
		}
		if (typeof parameters.totime === "number") {
			config.totime = parameters.totime;
		}
		if (typeof parameters.reverse_align === "boolean") {
			config.reverse_align = parameters.reverse_align;
		}
		if (config.maxentries === -1) {
			config.maxentries = null;
		}

		var _this = this;
		setImmediate(function() {
			var data = _this.history_data;
			if (config.fromtime !== null) {
				// find start index:
				var index = binarysearch(data, {"time": config.fromtime},
						function(a, b) { return a.time - b.time; });
				// if time was not found, index is bitwise flipped.
				if (index < 0) index = ~index;
				// do not include the element itself:
				else index = index + 1;

				if (index) {
					limited = true;
				}

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
				data = data.slice(0,index);
			}
			if (data.length - config.maxentries >= 0) {
				limited = true;
			}
			if (!config.reverse_align) {
				// cut at the beginning:
				data = data.slice(
					Math.max(data.length - config.maxentries, 0));
			} else {
				// cut at the end:
				data = data.slice(0, config.maxentries);
			}

			// return data:
			var exceeded = !limited;
			if (exceeded && config.totime === null &&
					config.fromtime === null &&
					(
					 config.interval === null ||
					 config.interval === 0
					) &&
					(
					 config.maxentries === null ||
					 config.maxentries <= 3000
					)
			) {
				if (_this.synced === true) {
					exceeded = false;
				} else {
					exceeded = function(l_data, l_exceeded) {
						if (l_exceeded ||
							!Array.isArray(l_data) ||
							l_data.length <=
							_this.history_data.length
						) {
							return;
						}
						l_data.forEach(function(d) {
							_this.add(d.time, d.value);
						});
						_this.synced = true;
					};
				}
			}
			callback(data, exceeded);
		});
	};
};
exports.history = history;

HistoryGlobal.modules.memory = exports.history;

