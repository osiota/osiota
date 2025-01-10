const Application = require("./application.js").application;
const async_calls = require("./helper_async_calls.js").async_calls;

/**
 * Application Loader class
 */
class application_loader {
	/**
	 * Creates an application loader
	 * @param {main} main - Main instance
	 */
	constructor(main) {
		this._main = main;
		this.apps = {};
	};

	/**
	 * [internal use] Emit Events to main
	 * @private
	 */
	emit() {
		return this._main.emit.apply(this._main, arguments);
	}

	/**
	 * Load applications
	 * @param {node} node - Parent node
	 * @param {object[]} apps - Application Structs
	 * @param {function} callback
	 */
	load(node, apps, callback) {
		var _this = this;
		var loaded_apps = [];
		if (Array.isArray(apps) && apps.length) {
			var count = 0;
			apps.forEach(function(struct) {
				try {
					_this.startup_struct(node, struct,
							function(a, level){
						loaded_apps.push(a);
						if (level == 1 && ++count == apps.length){
							if (typeof callback === "function") {
								callback(loaded_apps);
							}
						}
					});
				} catch(err) {
					console.error("Error in application loading:", err);
				}
			});
		} else {
			if (typeof callback === "function") {
				callback([]);
			}
		}
		return loaded_apps;
	}

	/**
	 * Startup an application by name and config
	 * @param {node} node - Parent node
	 * @param {string|application} app - Application Name or Application
	 * @param {object} app_config - Application Config
	 * @param {boolean} [auto_install] - Automatic Installation
	 * @param {boolean} [deactive] - Start as deactivated app
	 * @param {function} [callback]
	 * @returns {string} Application name
	 */
	startup(node, app, app_config, auto_install, deactive, callback) {
		if (typeof callback !== "function") {
			callback = deactive;
			deactive = undefined;
		}
		if (typeof callback === "undefined" &&
				typeof auto_install === "function") {
			callback = auto_install;
			auto_install = undefined;
		}
		var struct = {
			name: app,
			deactive: deactive,
			config: app_config,
		};
		if (node && node._app && node._app._struct) {
			struct = node._app._struct;
		}
		return this.startup_struct(node, struct, auto_install, callback);
	};

	/**
	 * Startup an application by struct
	 * @param {node} node - Parent node
	 * @param {object} struct - Application Struct
	 * @param {boolean} [auto_install] - Automatic Installation
	 * @param {function} [callback]
	 * @returns {string} Application name
	 */
	startup_struct(node, struct, auto_install, callback) {
		var _this = this;

		if (typeof struct !== "object" || struct === null) {
			if (typeof struct === "string") {
				struct = {"name": struct};
			} else {
				struct = {};
			}
		}
		if (typeof struct.config !== "object") {
			struct.config = {};
		}
		if (typeof callback === "undefined" &&
				typeof auto_install === "function") {
			callback = auto_install;
			auto_install = undefined;
		}

		if (typeof struct.name !== "string" && typeof struct.name !== "object"
				&& struct.name !== null) {
			console.warn("Warning: Application name option missing.", struct, node && node.name);
			return null;
		}

		var app = struct.name;
		var app_config = struct.config;

		return this.module_get(app, function(e, a) {
			if (e) {
				// announce error message:
				if (typeof a._config === "undefined") {
					a._config = app_config;
				}
				a._error = e;
			}

			// load app (with or without error):
			var m = _this.startup_module( a,
					node, struct,
					auto_install,
					callback);

			if (e) {
				a._set_state("ERROR_LOADING", e);

				// trigger global callback:
				/**
				 * Application Loading Error
				 * @param {object} error - Error object
				 * @param {node} node - Node object
				 * @param {app} app - Application name
				 * @param {object} app_config - Application config
				 * @param {*} extra - Extra information
				 * @param {boolean} auto_install - Auto install flag
				 * @event main#app_loading_error
				 */
				if (_this.emit("app_loading_error", e, a, node, app,
						app_config, auto_install,
						function(an, level) {
					if (typeof an === "object") {
						if (typeof callback === "function") {
							callback(an, level);
						}
					}
				})) {
					// assume that an other app as been loaded.
					return null;
				}

				// show error:
				console.error("error starting app:", e.stack || e);
			}

			return m;
		});

	};

	/**
	 * [internal use] Create Application Object and bind methods
	 * @private
	 */
	module_get(app, callback) {
		var _this = this;

		var appname = app;
		if (typeof app === "undefined" || app === null) {
			return;
		} else if (typeof app === "object") {
			appname = "unknown";
			if (typeof app._app === "string")
				appname = app._app;
		}
		appname = appname.replace(/^(er|osiota)-app-/, "");
		console.log("loading:", appname);

		var a = new Application(this, appname);
		if (typeof app === "string") {
			async_calls([
					this._main.require.bind(this._main, appname),
					this._main.load_schema.bind(this._main, appname)
				],
				function(err, results) {
					if (err) {
						return callback(err, a);
					}
					var struct = results[0];
					var schema = results[1];

					// bind module:
					a._bind_module(
						struct,
						_this.module_get.bind(_this),
						function(err) {
							if (err) {
								return callback(err, a);
							}
							a._bind_schema(
								schema,
								_this._main.load_schema.bind(_this._main),
								function(err) {
									callback(err, a);
								}
							);
						}
					);
				}
			);
		} else if (typeof app === "object" && app !== null) {
			a._bind_module(
				app,
				_this.module_get.bind(_this),
				function() {
					callback(null, a);
				}
			);
		} else {
			throw new Error("variable app has unknown type.");
		}
		return a;
	};

	/**
	 * [internal use] Bind application and initialize it
	 * @private
	 */
	startup_module(a, node, struct, auto_install, callback) {
		var _this = this;

		var app = struct.name;
		var app_config = struct.config;
		var deactive = struct.deactive;

		var appname = a._get_app_name();
		var app_identifier = appname;
		var app_increment = 2;
		while(this.apps.hasOwnProperty(app_identifier)) {
			app_identifier = appname + " " + app_increment++;
		}
		a._id = app_identifier;

		a._struct = struct;

		if (typeof callback === "undefined" &&
				typeof auto_install === "function") {
			callback = auto_install;
			auto_install = undefined;
		}

		console.log("startup:", a._app);
		// bind to main:
		a._bind(this._main);

		if (typeof app_config !== "object") {
			// Warning: app_config is not an object
			app_config = {};
		}
		if (Object.keys(app_config).length == 0) {
			a._auto_configure(app_config);
		}

		if (typeof node !== "object" || node === null) {
			node = this._main.node("/app");
		}
		a._rnode = node;

		var node_base = node;
		if (typeof app_config.base === "string") {
			node_base = node.node(app_config.base);
		}

		var node_destination = null;
		var node_postname = "";
		if (typeof a.node_postname === "string") {
			node_postname = a.node_postname;
		}
		if (typeof app_config.node === "string") {
			node_destination = node_base.node(app_config.node + node_postname);
		} else if (typeof app_config.pnode === "string") {
			node_destination = node.node(app_config.pnode);
		} else if (typeof a.default_node_name === "string") {
			node_destination = node_base.node(a.default_node_name);
		} else {
			node_destination = node_base.node(a._id);
		}

		if (node_destination._app &&
				a._app === node_destination._app._app) {
			a = node_destination._app;
		} else {
			a._node = node_destination;
			this.app_register(a);
		}

		a._base = node_base;

		// TODO TODO TODO: In seperate app?
		var node_source = node_base;
		if (typeof app_config.source === "string") {
			node_source = node_base.node(app_config.source);
		}
		var node_target = node_base;
		if (typeof app_config.target === "string") {
			node_target = node_base.node(app_config.target);
		}
		a._source = node_source;
		a._target = node_target;

		// init:
		try {
			if (deactive) {
				a._init_deactive(app_config);

				this.emit("app_init_deactive", a);

			} else if (!a._error) {
				a._init(app_config);
				/**
				 * Application init
				 *
				 * @event main#app_init
				 * @param {application} application - Application object
				 */
				this.emit("app_init", a);

				if (typeof callback === "function") {
					callback(a, 1);
				}
			}
		} catch(e) {
			// save error:
			a._set_state("ERROR_STARTING", e, app_config);
			a._error = e;

			// trigger global callback:
			this.emit("app_init_error", e, node, app, app_config,
						auto_install);
			// show error:
			console.error("error starting app:", e.stack || e);
		}

		// load child apps:
		if (Array.isArray(app_config.app)) {
			app_config.app.forEach(function(struct) {
				_this.startup_struct(node_destination, struct,
						auto_install,
						function(a, level) {
					if (typeof callback === "function") {
						callback(a, level+1);
					}
				});
			});
		}

		return a;
	};

	/**
	 * [internal use] Register application to main
	 * @private
	 */
	app_register(a) {
		this.apps[a._id] = a;

		var appname = a._app;
		var node = a._node;

		if (appname === "node") {
			if (!node._app) {
				node._app = a;
			}
			// else do nothing
		} else {
			if (node._app) {
				if (node._app._app === "node") {
					node._app = a;
				} else {
					console.warn("There is already an app bind " +
						"to that node:", node.name,
						"(", a._app, "vs", node._app._app, ")");
					node._app = a;
				}
			} else {
				node._app = a;
			}
		}

		/**
		 * Application added
		 *
		 * @event main#app_added
		 * @param {application} application - Applicaiton name
		 * @param {string} application_id - Id
		 */
		this.emit("app_added", a, a._id);

	};

	/**
	 * [internal use] Unregister application to main
	 * @private
	 */
	app_unregister(a) {
		delete this.apps[a._id];

		var node = a._node;
		if (typeof node._app == "object" &&
				node._app === a) {
			delete node._app;
		}
	};

	/**
	 * Stop all applications
	 */
	close() {
		var _this = this;
		for (var a in _this.apps) {
			console.log("unloading:", a);
			if (_this.apps[a]._unload) {
				try {
					_this.apps[a]._unload();
				} catch(e) {
					console.error("Error unloading", e);
				}
				delete _this.apps[a];
			}
		}
	};



	app_add_helper(config, app, settings) {
		if (!Array.isArray(config.app)) {
			config.app = [];
		}
		var struct = {
			"name": app,
			"config": settings
		}
		this._main.config_cleaning(struct);

		config.app.push(struct);
		return struct;
	};

	app_add(app, settings, node, config, callback) {
		// save to config:
		if (!config) {
			config = this._main._config;
		}
		if (config.__is_persistent !== true) {
			throw new Error("given config is not persistent");
		}
		if (typeof settings !== "object")
			settings = {};
		if (node) {
			if (typeof node._app === "object" &&
					node._app._state === "RUNNING" &&
					node._app._config.__is_persistent === true) {
				config = node._app._config;
			// if node has global position and source is not set:
			} else if (typeof settings.source !== "string" &&
					typeof settings.node === "string"  &&
					settings.node.match(/^\//)) {
				settings.source = node.name;
			// if not global position
			} else if (typeof settings.source !== "string" ||
					!settings.source.match(/^\//) ||
					typeof settings.node !== "string" ||
					!settings.node.match(/^\//)) {
				var struct_n = this.app_add_helper(config, "node", {
					"node": node.name
				});
				this.startup_struct(node, struct_n);
				config = struct_n.config;
			}
		}

		var struct = this.app_add_helper(config, app, settings);
		return this.startup_struct(node, struct, undefined, undefined,callback);
	};

	app_remove(app) {
		if (typeof app === "string") {
			app = this.apps[app];
		}
		if (typeof app !== "object") {
			console.log("type", typeof app);
			throw new Error("app_remove: app is not an object");
		}

		// unload app:
		try {
			app._unload();
		} catch(e) {
			console.error("Error unloading", e);
			//a._set_state("ERROR_UNLOADING", e);
		}

		this.app_unregister(app);

		// remove from config:
		app._config.__remove_app = true;

		// init config cleaning:
		this._main.config_cleaning();
	};

	/**
	 * Reload an app by creating a new app object
	 * @param {application} app - Old app instance
	 * @param {function} callback - Triggered on loaded app
	 * @example
	 * app._config.node = "/newnodename";
	 * application_loader.app_reload(app, function(a) {
	 *     app = a;
	 * });
	 */
	app_reload(app, callback) {
		// buffer old references:
		var rnode = app._rnode;
		var aconfig = app._config;
		var aname = app._app;

		// unload app
		app._unload();
		this.app_unregister(app);

		// add timeout?

		// load app
		return this.load(rnode, [{
			"name": aname,
			"config": aconfig
		}], function(a) {
			callback(a[0]);
		});
	};

};
exports.application_loader = application_loader;

