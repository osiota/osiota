
const HistoryGlobal = require("./module_history_global.js");

/* history */
class history extends HistoryGlobal.history {
	constructor(node, history_config) {
		super(node, history_config);
		this.node = node;
	};

	/* history: add new data */
	add(time, value) {
		// do nothing.
	};
	/* history: get old data */
	get(config, callback) {
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
};
exports.history = history;

HistoryGlobal.modules.remote = exports.history;
