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
	this._state = "INIT";

	this._id = id;
	this._app = app;
	this._config = app_config;
	this._extra = extra;

	this._node = node;
	this._main = main;

	this._error = null;
};
exports.application.prototype._bind_module = function(module) {
	this._module = module;
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
		this.init(this._node, this._config, this._main, this._extra);
	}

	this._state = "RUNNING";
};
exports.application.prototype._unload = function() {
	if (typeof this.unload === "function") {
		this.unload();
	}

	this._state = "UNLOADED";
};
exports.application.prototype._reinit = function(app_config) {
	this._state = "REINIT";
	if (typeof this.reinit === "function") {
		this._config = app_config;
		this.reinit(app_config);
	} else {
		this._unload();
		if (app_config) {
			this._config = app_config;
		}
		this._init();
	}

	this._state = "RUNNING";
};

