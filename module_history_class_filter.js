
const HistoryGlobal = require("./module_history_global.js");

class history extends HistoryGlobal.history {
	constructor(node, config) {
		super(node, config);
		this.interval = config.interval;
		if (typeof this.interval !== "number") {
			this.interval = 0;
		}

		this.submodules_init(node, config);
	};

	add(time, value) {
		this.submodules_add(time, value);
	};

	get(parameters, callback) {
		if (typeof parameters.interval !== "number") {
			parameters.interval = 0;
		}

		if (parameters.interval == this.interval) {
			this.submodules_get(parameters, callback);
		} else {
			callback([], true);
		}
	};
};
exports.history = history;

HistoryGlobal.modules.filter = exports.history;

