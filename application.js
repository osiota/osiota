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
var merge = require("./helper_merge_data.js").merge;

/**
 * Application Class
 * @class
 * @param {string} app - Application name
 */
exports.application = function(app) {
	this._state = "INIT";

	this._app = "[unknown]";
	if (typeof app === "string")
		this._app = app;

	this._config = {};

	this._node = null;

	this._id = Math.random().toString(36).substring(2, 15) +
		   Math.random().toString(36).substring(2, 15);

	this._error = null;
};
/**
 * bind to main class
 * @param {main} main - main instance
 * @param {*} extra - extra information
 */
exports.application.prototype._bind = function(main, extra) {
	this._extra = extra;
	this._main = main;
};
/**
 * bind to module context
 * @param {object} module - Module context
 * @param {function} loader - Loader function
 * @param {function} callback
 */
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
/**
 * copy module context
 * @param {object} module - Module context
 * @private
 */
exports.application.prototype._bind_module_sync = function(module) {
	for (var field in module) {
		if (module.hasOwnProperty(field)) {
			if (!field.match(/^_/))
				this[field] = module[field];
		}
	}
	return this;
};
/**
 * Load inherited modules
 * @param {string[]|string} inherit - List of module names
 * @param {function} loader - Loader function
 * @param {function} callback
 * @private
 */
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

/**
 * Auto configure application
 * @name application#auto_configure
 * @method
 * @param {object} app_config - Config object
 * @abstract
 */

/**
 * Auto configure application
 * @param {object} app_config - Config object
 */
exports.application.prototype._auto_configure = function(app_config) {
	if (typeof this.auto_configure === "function") {
		this.auto_configure(app_config);
	}
};


/**
 * Init method
 *
 * @name application#init
 * @method
 * @param {object} app_config - Config object
 * @param {node} node - Node object
 * @param {main} main - Main instance
 * @param {*} extra - Extra information
 * @return {Array<object>} A cleaning object
 */
/**
 * Call init function
 * @param {object} app_config - Config object
 */
exports.application.prototype._init = function(app_config) {
	if (this._state === "RUNNING") {
		console.log("Warning: App still running: doing reinit");
		return this._reinit(app_config);
	}
	if (typeof app_config === "object" && app_config !== null) {
		this._config = app_config;
	}
	this._node.connect_config(app_config);
	if (typeof this.init === "function") {
		// TODO: Change Arguments:
		this._object = this.init(this._node, this._config,
				this._main, this._extra);
		if (!this._node._announced) {
			var a = this._node.announce({});
			this._object = [a, this._object];
		}
	} else if (typeof this.cli !== "function") {
		console.warn("WARNING: No init and no cli function found:", this._app);
	}

	this._state = "RUNNING";
};

/**
 * Unload method
 *
 * @name application#unload
 * @method
 * @param {Array<object>} object - The cleaning object (see init)
 * @param {function} unload_object - Unload object helper function
 */
/**
 * Call unload function
 * @param {object} app_config - Config object
 */
exports.application.prototype._unload = function() {
	if (this._state !== "RUNNING" && this._state !== "REINIT")
		return;

	this._node.connect_config(null);

	if (typeof this.unload === "function") {
		this.unload(this._object, unload_object);
	} else {
		unload_object(this._object);
		this._object = null;
	}

	this._state = "UNLOADED";
};
/**
 * Reinit method
 *
 * @name application#reinit
 * @param {object} app_config - Config object
 * @param {node} node - Node object
 * @param {main} main - Main instance
 * @param {*} extra - Extra information
 */
/**
 * Call reinit function
 * @param {object} app_config - Config object
 */
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
		this._node.connect_config(app_config);
		this._node._announced = null;
		this.reinit(this._node, this._config, this._main, this._extra);
		if (!this._node._announced) {
			this._node.announce({}, true);
		}
		this._state = "RUNNING";
	} else {
		this._unload();
		setImmediate(function() {
			_this._node.connect_config(app_config);
			_this._init(app_config);
			this._state = "RUNNING";
		});
	}

};
/**
 * Call reinit function with delay
 * @param {number} delay - Delay in ms
 * @param {object} app_config - Config object
 */
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

exports.application.prototype._cli = function(args, show_help) {
	if (typeof this.cli === "function") {
		this.cli(args, show_help, this._main, this._extra);
	}
};

exports.application.prototype.rpc_node_config = function(reply, config, save) {
	// update config object:
	this._config = merge(this._config, config);

	// restart app:
	if (this._app) {
		this._app._reinit(this._config);
	}

	if (save) {
		this._main.emit("config_save");
	}
	reply(null, "okay");
};

