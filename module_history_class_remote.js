
var util = require('util');
var HistoryGlobal = require("./module_history_global.js");

/* history */
exports.history = function(node, history_config) {
	this.node = node;
};
util.inherits(exports.history, HistoryGlobal.history);

/* history: add new data */
exports.history.prototype.add = function(time, value) {
	// do nothing.
};
/* history: get old data */
exports.history.prototype.get = function(config, callback) {
	if (this.node.hasOwnProperty("connection")) {
		this.node.rpc("history", config, function(data) {
			callback(data, false);
		});
	} else {
		callback([], true);
	}
};

HistoryGlobal.modules.remote = exports.history;
