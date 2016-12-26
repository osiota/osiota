/*
 * Application state model:
 *
 * RUNNING -- (unload) --> UNLOADED
 *
 * UNLOADED -- (init) --> REINIT --> RUNNING
 *
 * INIT -- (*) --> RUNNING
 */

exports.application = function(id, app, node, app_config, main, extra) {
	this.state = "INIT";

	this.id = id;
	this.app = app;
	this.config = app_config;
	this.extra = extra;

	this.node = node;
	this.main = main;

	this.error = null;
};
exports.application.prototype._bind_module = function(module) {
	this.module = module;
	for (var field in module) {
		if (module.hasOwnProperty(field)) {
			this[field] = module[field];
		}
	}
	return this;
};
exports.application.prototype._init = function() {
	if (typeof this.init === "function") {
		// TODO: Change Arguments:
		this.init(this.node, this.config, this.main, this.extra);
	}

	this.state = "RUNNING";
};
exports.application.prototype._unload = function() {
	if (typeof this.unload === "function") {
		this.unload();
	}

	this.state = "UNLOADED";
};
exports.application.prototype._reinit = function(app_config) {
	this.state = "REINIT";
	if (typeof this.reinit === "function") {
		this.config = app_config;
		this.reinit(app_config);
	} else {
		this._unload();
		if (app_config) {
			this.config = app_config;
		}
		this._init();
	}

	this.state = "RUNNING";
};

