
exports.modules = {};

exports.get_history_module = function(config) {
	const type = config.type;
	if (exports.modules.hasOwnProperty(type)) {
		return exports.modules[type];
	}
	throw new Error("History module not found: " + type);
}

const get_walk = function(modules, parameters, callback) {
	if (modules.length == 0) {
		callback([], true);
		return;
	}
	const m = modules.shift();
	m.get(parameters, function(data, exceeded) {
		if (!exceeded) {
			callback(data, exceeded);
		} else {
			get_walk(modules, parameters, function(data_e, exceeded_e) {
				if (typeof exceeded === "function") {
					exceeded(data_e, exceeded_e);
				}
				if (data_e.length == 0)
					data_e = data;
				callback(data_e, exceeded_e);
			});
		}
	});
}

/* history */
class history {
	constructor(node, config) {
		this.submodules_init(node, config);
	}
	submodules = [];

	submodules_init(node, config) {
		const _this = this;
		if (typeof config.submodules !== "object" &&
				!Array.isArray(config.submodules)) {
			return false;
		}
		config.submodules.forEach(function(c) {
			try {
				const HM = exports.get_history_module(c);
				const m = new HM(node, c);
				_this.submodules.push(m);
			} catch(e) {
				if (e.toString() != "Error: History module not found: file" && e.toString() != "Error: Module disabled.") {
					console.warn("History Error:", e);
				}
			}
		});
	};
	/* history: add new data */
	add(time, value) {
		this.submodules_add(time, value);
	};
	submodules_add(time, value) {
		if (time === null)
			return;

		this.submodules.forEach(function(d) {
			d.add(time, value);
		});
	};

	/* history: get old data */
	get(parameters, callback) {
		return this.submodules_get(parameters, callback);
	};
	submodules_get(parameters, callback) {
		// walk through modules, till one fits:
		get_walk(this.submodules.slice(), parameters, callback);
	};
};
exports.history = history;

exports.modules.global = exports.history;
