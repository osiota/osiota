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

	this._id = Math.random().toString(36).substring(2, 15) +
		   Math.random().toString(36).substring(2, 15);

	this._error = null;
};
exports.application.prototype._bind = function(main, extra) {
	this._extra = extra;
	this._main = main;
};
exports.application.prototype._bind_module = function(module, loader, callback){
	var _this = this;

	this._module = module;
	if (typeof module !== "object" || module === null) {
		throw new Error("module is not an object");
	}
	if (typeof module.inherit === "object" &&
			Array.isArray(module.inherit) &&
			module.inherit.length) {
		var inherit = module.inherit.slice(0);
		this._inherit(inherit, loader, function() {
			_this._bind_module_sync(module);
			callback();
		});
		return;
	}
	this._bind_module_sync(module);
	callback();
};
exports.application.prototype._bind_module_sync = function(module) {
	for (var field in module) {
		if (module.hasOwnProperty(field)) {
			if (!field.match(/^_/))
				this[field] = module[field];
		}
	}
	return this;
};
exports.application.prototype._inherit = function(inherit, loader, callback) {
	var _this = this;

	if (Array.isArray(!inherit) || !inherit.length ) {
		callback();
		return;
	}
	var iname = inherit.shift();
	if (typeof iname !== "string") {
		throw new Error("inherit: application name is not string.");
	}

	loader(iname, function(m) {
		if (typeof _this._base !== "object") {
			_this._base = {};
		}
		_this._base[iname] = m;
		_this._bind_module(m, loader, function() {
			_this._inherit(inherit, loader, callback);
		});
	});
};

exports.application.prototype._init = function(app_config) {
	if (typeof app_config === "object" && app_config !== null) {
		this._config = app_config;
	}
	if (typeof this.init === "function") {
		// TODO: Change Arguments:
		this._object = this.init(this._node, this._config,
				this._main, this._extra);
	} else {
		console.warn("WARNING: No init function found:", this._app);
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
	var _this = this;
	if (this._state !== "RUNNING" && this._state !== "REINIT")
		return;
	console.log("restarting app:", this._id);

	this._state = "REINIT";
	if (typeof this.reinit === "function") {
		if (typeof app_config === "object" && app_config !== null) {
			this._config = app_config;
		}
		this.reinit(this._node, this._config, this._main, this._extra);
	} else {
		this._unload();
		setImmediate(function() {
			_this._init(app_config);
		});
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

