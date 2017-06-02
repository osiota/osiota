
exports.modules = {};

exports.get_history_module = function(config) {
	var type = config.type;
	if (exports.modules.hasOwnProperty(type)) {
		return exports.modules[type];
	}
	throw new Error("History module not found: " + type);
}

/* history */
exports.history = function(node, config) {
	console.log("node", node.name);
	this.submodules_init(node, config);
}

exports.history.prototype.submodules_init = function(node, config) {
	var _this = this;
	if (typeof config.submodules !== "object" &&
			!Array.isArray(config.submodules)) {
		return false;
	}
	this.submodules = [];
	var _this = this;
	config.submodules.forEach(function(c) {
		try {
			HM = exports.get_history_module(c);
			var m = new HM(node, c);
			_this.submodules.push(m);
		} catch(e) {
			if (e.toString() != "Error: History module not found: file") {
				console.warn("History Error:", e.stack || e);
			}
		}
	});
};
/* history: add new data */
exports.history.prototype.add = function(time, value) {
	this.submodules_add(time, value);
};
exports.history.prototype.submodules_add = function(time, value) {
	if (time === null)
		return;

	this.submodules.forEach(function(d) {
		d.add(time, value);
	});
};
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
			get_walk(modules, parameters, function(data_e, exceeded) {
				if (data_e.length == 0)
					data_e = data;
				callback(data_e, exceeded);
			});
		}
	});
}

/* history: get old data */
exports.history.prototype.get = function(parameters, callback) {
	return this.submodules_get(parameters, callback);
};
exports.history.prototype.submodules_get = function(parameters, callback) {

	// walk through modules, till one fits:
	get_walk(this.submodules.slice(), parameters, callback);
};

exports.modules.global = exports.history;
