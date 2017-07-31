
var util = require('util');
var HistoryGlobal = require("./module_history_global.js");

exports.history = function (node, config) {
	this.interval = config.interval;
	if (typeof this.interval !== "number") {
		this.interval = 0;
	}

	this.submodules_init(node, config);
};
util.inherits(exports.history, HistoryGlobal.history);

exports.history.prototype.add = function (time, value) {
	this.submodules_add(time, value);
};

exports.history.prototype.get = function (parameters, callback) {
	if (typeof parameters.interval !== "number") {
		parameters.interval = 0;
	}

	if (parameters.interval == this.interval) {
		this.submodules_get(parameters, callback);
	} else {
		callback([], true);
	}
};

HistoryGlobal.modules.filter = exports.history;

