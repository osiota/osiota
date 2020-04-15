
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
	if (this.node.hasOwnProperty("connection") &&
			!config.local) {
		this.node.rpc("history", config, function(err, data) {
			if (err) {
				console.warn("history: can not get remote history.", err);
				callback([], true);
			} else {
				callback(data, false);
			}
		});
	} else {
		callback([], true);
	}
};

HistoryGlobal.modules.remote = exports.history;
