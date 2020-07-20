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
 * Osiota can run applications. This is the base class every application
 * automatically inherits methods and attributes from. An application is
 * started when the `init()` function is called by osiota. It can `inherit`
 * methods and attributes from other applications.
 *
 * @class
 * @classdesc Application class
 * @name application
 * @param {string} app - Application name
 * @tutorial doc/build_your_own_apps.md
 * @hideconstructor
 */
exports.application = function(app) {
	this._state = "INIT";

	this._app = "[unknown]";
	if (typeof app === "string")
		this._app = app;

	this._config = {};
	this._schema = null;

	this._node = null;

	this._id = Math.random().toString(36).substring(2, 15) +
		   Math.random().toString(36).substring(2, 15);

	this._error = null;
};
/**
 * [internal use] Bind to main class
 * @param {main} main - main instance
 * @param {*} extra - extra information
 * @private
 */
exports.application.prototype._bind = function(main, extra) {
	this._extra = extra;
	this._main = main;
};
/**
 * List the application names this application shall inherit attributes and methods from. You can use every application name. The application needs to be installed.
 *
 * @name application#inherit
 * @type {string|string[]}
 * @example
 * exports.inherit = [ "parse-text" ];
 */
/**
 * [internal use] Bind to module context
 * @param {object} module - Module context
 * @param {function} loader - Loader function
 * @param {function} callback
 * @private
 */
exports.application.prototype._bind_module = function(module, loader, callback){
	var _this = this;

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
 * Copy module context
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
 * [internal use] Bind schema information
 * @param {object} schema - Configuration schema
 * @param {function} loader - Schema loader function
 * @param {function} callback
 * @private
 */
exports.application.prototype._bind_schema = function(schema, loader, callback){
	this._schema = schema;

	if (typeof this.get_schema === "function") {
		return this.get_schema(schema, loader, callback);
	}
	callback();
}
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
 * This method is called before the init function when no configuration
 * was provided.
 *
 * @name application#auto_configure
 * @method
 * @param {object} app_config - (The empty) config object
 * @abstract
 */

/**
 * Auto configure application
 * @param {object} app_config - Config object
 * @private
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
 * @return {object} A cleaning object
 * @abstract
 * @example
 * exports.init = function(node, app_config, main, extra) {
 *     node.announce({ type: "my.app" });
 *     node.publish(undefined, 123);
 *
 *     return node;
 * };
 */
/**
 * [internal use] Call init function
 * @param {object} app_config - Config object
 * @private
 */
exports.application.prototype._init = function(app_config) {
	if (this._state === "RUNNING") {
		console.log("Warning: App still running: doing reinit");
		return this._reinit(app_config);
	}
	this._node.connect_schema(this._schema);
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
 * @abstract
 */
/**
 * [internal use] Call unload function
 * @param {object} app_config - Config object
 * @private
 */
exports.application.prototype._unload = function() {
	if (this._state !== "RUNNING" && this._state !== "REINIT")
		return;

	this._node.connect_schema(null);
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
 * @method
 * @param {object} app_config - Config object
 * @param {node} node - Node object
 * @param {main} main - Main instance
 * @param {*} extra - Extra information
 * @abstract
 */
/**
 * [internal use] Call reinit function
 * @param {object} app_config - Config object
 * @private
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
 * [internal use] Call reinit function with delay
 * @param {number} delay - Delay in ms
 * @param {object} app_config - Config object
 * @private
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

/**
 * This method is called from the command line interface (cli) when
 * `osiota --app myapp` is executed.
 *
 * @name application#cli
 * @method
 * @param {object} args - Command line arguments
 * @param {boolean} show_help - Show help message
 * @param {main} main - Main instance
 * @param {*} extra - Extra information
 * @abstract
 * @example
 * exports.cli = function(args, show_help, main, extra) {
 *	if (show_help) {
 *		console.group();
 *		console.info(
 *			'  --config [file]  Path to the config file\n' +
 *			'                 (default: "config.json")\n' +
 *			'  --name [name]  Name and filename of the service\n' +
 *		console.groupEnd();
 *		return;
 *	}
 *	// ...
 * };
 */
/**
 * [internal use] Call cli function
 * @param {object} args - Command line arguments
 * @param {boolean} show_help - Show help message
 * @private
 */
exports.application.prototype._cli = function(args, show_help) {
	if (typeof this.cli === "function") {
		return this.cli(args, show_help, this._main, this._extra);
	}
};

/**
 * [internal use] Reinit and save new app configuration
 * @param {function} reply - RPC reply function
 * @param {object} config - New config object
 * @param {boolean} save - Flag to save the configuration
 * @private
 */
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
