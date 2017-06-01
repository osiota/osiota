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
		this._unload_object(this._object);
	}

	this._state = "UNLOADED";
};
exports.application.prototype._reinit = function(app_config) {
	this._state = "REINIT";
	if (typeof this.reinit === "function") {
		if (typeof app_config === "object") {
			this._config = app_config;
		}
		this.reinit(this._config);
	} else {
		this._unload();
		if (typeof app_config === "object") {
			this._config = app_config;
		}
		this._init();
	}

	this._state = "RUNNING";
};
exports.application.prototype._unload_object = function(object) {
	var _this = this;
	if (typeof object === "function") {
		if (typeof object.remove === "function") {
			object.remove();
		} else {
			object();
		}
	} else if (typeof object === "object") {
		if (Array.isArray(object)) {
			object.forEach(function(o) {
				_this._unload_object(o);
			});
		// nodejs timers:
		} else if (typeof object.close === "function") {
			object.close();
		// subscribe:
		} else if (typeof object.remove === "function") {
			object.remove();
		// node:
		} else if (typeof object.unannounce === "function") {
			object.unannounce();
		// other app:
		} else if (object !== this &&
				typeof object._unload === "function") {
			object._unload();
		}
	} else if (typeof object === "number") {
		clearTimeout(object);
	}
};

