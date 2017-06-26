/*
 * Application state model:
 *
 * RUNNING -- (unload) --> UNLOADED
 *
 * UNLOADED -- (init) --> REINIT --> RUNNING
 *
 * INIT -- (*) --> RUNNING
 */

var unload_object = require("./helper_unload_object.js").unload_object;

exports.application = function(app) {
	this._state = "INIT";

	this._app = "er-app-unknown";
	if (typeof app === "string")
		this._app = app;

	this._config = {};

	this._node = null;

	this._error = null;
};
exports.application.prototype._bind = function(id, main, extra) {
	this._id = id;
	this._extra = extra;
	this._main = main;
};
exports.application.prototype._bind_module = function(module) {
	this._module = module;
	for (var field in module) {
		if (module.hasOwnProperty(field)) {
			if (!field.match(/^_/))
				this[field] = module[field];
		}
	}
	return this;
};
exports.application.prototype._init = function(app_config) {
	if (typeof app_config === "object" && app_config !== null) {
		this._config = app_config;
	}
	if (typeof this.init === "function") {
		// TODO: Change Arguments:
		this._object = this.init(this._node, this._config,
				this._main, this._extra);
	}

	this._state = "RUNNING";
};
exports.application.prototype._unload = function() {
	if (this._state !== "RUNNING" && this._state !== "REINIT")
		return;

	if (typeof this.unload === "function") {
		this.unload(this._object);
	} else {
		unload_object(this._object);
		this._object = null;
	}

	this._state = "UNLOADED";
};
exports.application.prototype._reinit = function(app_config) {
	if (this._state !== "RUNNING" && this._state !== "REINIT")
		return;

	this._state = "REINIT";
	if (typeof this.reinit === "function") {
		if (typeof app_config === "object" && app_config !== null) {
			this._config = app_config;
		}
		this.reinit(this._node, this._config, this._main, this._extra);
	} else {
		this._unload();
		this._init(app_config);
	}

	this._state = "RUNNING";
};
exports.application.prototype._reinit_delay = function(delay, app_config) {
	if (typeof delay !== "number")
		delay = 1000;

	if (this._state !== "RUNNING")
		return;

	var _this = this;
	this._state = "REINIT";
	setTimeout(function() {
		if (_this._state === "REINIT")
			_this._reinit(app_config);
	}, delay);
};

