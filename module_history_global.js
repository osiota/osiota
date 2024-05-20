
exports.modules = {};

exports.get_history_module = function(config) {
	var type = config.type;
	if (exports.modules.hasOwnProperty(type)) {
		return exports.modules[type];
	}
	throw new Error("History module not found: " + type);
}

var get_walk = function(modules, parameters, callback) {
	if (modules.length == 0) {
		callback([], true);
		return;
	}
	var m = modules.shift();
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
		var _this = this;
		if (typeof config.submodules !== "object" &&
				!Array.isArray(config.submodules)) {
			return false;
		}
		var _this = this;
		config.submodules.forEach(function(c) {
			try {
				var HM = exports.get_history_module(c);
				var m = new HM(node, c);
				_this.submodules.push(m);
			} catch(e) {
				if (e.toString() != "Error: History module not found: file" && e.toString() != "Error: Module disabled.") {
					console.warn("History Error:", e.stack || e);
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
