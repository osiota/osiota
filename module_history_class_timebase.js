
const HistoryGlobal = require("./module_history_global.js");

class history extends HistoryGlobal.history {
	constructor(node, config) {
		super(node, config);
		this.interval = config.interval;
		if (typeof this.interval !== "number") {
			this.interval = 0;
		}

		this.sum = null;
		this.count = 0;
		this.last_time_slot = null;
	};

	add(time, value) {
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
			if (this.last_time_slot !== null) {
				var new_value = this.sum;
				if (this.count != 0) { // else sum is null
					new_value /= this.count;
				}
				var new_time = (this.last_time_slot+1)*this.interval;
				this.submodules_add(new_time, new_value);
			}

			this.sum = null;
			this.count = 0;

			this.last_time_slot = time_slot;
		}
		if (value !== null) {
			this.sum += value;
			this.count++;
		}
	};

	get(parameters, callback) {
		if (typeof parameters.interval !== "number") {
			parameters.interval = 0;
		}

		if (parameters.interval >= this.interval) {
			this.submodules_get(parameters, callback);
		} else {
			callback([], true);
		}
	};
};
exports.history = history;

HistoryGlobal.modules.timebase = exports.history;

