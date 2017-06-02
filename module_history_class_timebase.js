
var util = require('util');
var HistoryGlobal = require("./module_history_global.js");

exports.history = function (node, config) {
	this.interval = config.interval;
	if (typeof this.interval !== "number") {
		this.interval = 0;
	}

	this.sum = 0;
	this.count = 0;
	this.last_time_slot = null;

	this.submodules_init(node, config);
};
util.inherits(exports.history, HistoryGlobal.history);

exports.history.prototype.add = function (time, value) {
	if (time === null)
		return;

	if (this.interval == 0) {
		this.submodules_add(time, value);
		return;
	}

	var time_slot = Math.floor(time / this.interval);
	if (time_slot != this.last_time_slot) {
		// missed a time slot:
		if (time_slot - 1 != this.last_time_slot) {
			this.submodules_add(
				(time_slot-2)*this.interval,
				null
			);
		}
		if (this.count != 0) {
			var new_value = this.sum / this.count;
			var new_time = (this.last_time_slot+1)*this.interval;
			this.submodules_add(new_time, new_value);
		}

		this.sum = 0;
		this.count = 0;

		this.last_time_slot = time_slot;
	}
	this.sum += value;
	this.count++;
};

exports.history.prototype.get = function (parameters, callback) {
	if (typeof parameters.interval !== "number") {
		parameters.interval = 0;
	}

	if (parameters.interval >= this.interval) {
		this.submodules_get(parameters, callback);
	} else {
		callback([], true);
	}
};

HistoryGlobal.modules.timebase = exports.history;
