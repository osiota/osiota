/*
 * Application state model:
 *
 * RUNNING -- (unload) --> UNLOADED
 *
 * UNLOADED -- (init) --> REINIT --> RUNNING
 *
 * INIT -- (*) --> RUNNING
 */

const EventEmitter = require('events').EventEmitter;

const unload_object = require("unload-object").unload;

/**
 * Application Class
 *
 * Osiota can run applications. This is the base class every application
 * automatically inherits methods and attributes from. An application is
 * started when the `init()` function is called by osiota. It can `inherit`
 * methods and attributes from other applications.
 *
 * @tutorial doc/build_your_own_apps.md
 */
class application extends EventEmitter {
	/**
	 * Creates an Application
	 * @param {application_loader} application_loader - Application Loader instance
	 * @param {string} appname - Application name
	 */
	constructor(application_loader, appname) {
		super();

		this._application_loader = application_loader;

		this._state = "INIT";


		this._app = "[unknown]";
		if (typeof appname === "string") {
			appname = appname.replace(/^(er|osiota)-app-/, "");
			this._app = appname;
		} else if (typeof appname === "object") {
			this._app = "unknown";
			if (typeof appname._app === "string")
				this._app = appname._app;
		}

		this._config = {};
		this._schema = null;

		this._node = null;

		this._id = Math.random().toString(36).substring(2, 15) +
			   Math.random().toString(36).substring(2, 15);

		this._error = null;
	};

	/**
	 * [internal use] Set state
	 * @param {string} state - the new state
	 * @private
	 */
	_set_state(state, error, app_config) {
		if (state === "ERROR_LOADING" || state === "ERROR_STARTING" ||
				state === "ERROR_APP") {
			if (typeof app_config === "object" && app_config !== null) {
				this._config = app_config;
			}
			this._state = state;
			this._error = error;

			// if app is not completely loaded _node can be null
			if (this._node) {
				this._node.connect_schema(this._schema);
				this._node.connect_config(this._config);
				this._object = this._node.announce([this._config.metadata, {
					"type": "app.error",
					"state": state,
					"error": error.stack || error
				}]);
			}
		}
		return this;
	};
	/**
	 * Set Error State
	 * @param {object} error - Error object
	 * @private
	 */
	_handle_error(error) {
		this._set_state("ERROR_APP", error);
		console.error(this._app, "Error on app:", error);
	}
	/**
	 * [internal use] Bind to main class
	 * @param {main} main - main instance
	 * @private
	 */
	_bind(main) {
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
	async _bind_module(module, loader, callback){
		if (typeof module !== "object" || module === null) {
			throw new Error("module is not an object");
		}
		if (typeof module.inherit === "object" &&
				Array.isArray(module.inherit) &&
				module.inherit.length) {
			const inherit = module.inherit.slice(0);
			await this._inherit(inherit, loader);
		}
		this._bind_module_sync(module);
		return this;
	};
	/**
	 * Copy module context
	 * @param {object} module - Module context
	 * @private
	 */
	_bind_module_sync(module) {
		for (const field in module) {
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
	async _bind_schema(schema, loader, callback){
		this._schema = schema;

		if (typeof this.get_schema === "function") {
			let callback;
			const promise = new Promise((resolve, reject)=>{
				callback = (err, data)=>{
					if (err) return reject(err);
					resolve(data);
				};
			});

			const r = this.get_schema(schema, loader, callback);
			if (typeof r.then === "function") {
				const r_schema = await r;
				if (r_schema) {
					this._schema = r_schema;
				}
				return this;
			}
			await promise;
			return this;
		}
		return this;
	}
	/**
	 * Load inherited modules
	 * @param {string[]|string} inherit - List of module names
	 * @param {function} loader - Loader function
	 * @param {function} callback
	 * @private
	 */
	async _inherit(inherit, loader) {
		if (Array.isArray(!inherit) || !inherit.length ) {
			return null;
		}
		const iname = inherit.shift();
		if (typeof iname !== "string") {
			throw new Error("inherit: application name is not string.");
		}

		const m = await loader(iname);

		if (typeof this._super !== "object") {
			this._super = {};
		}
		this._super[iname] = m;
		await this._bind_module(m, loader);
		await this._inherit(inherit, loader);
		return this;
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
	_auto_configure(app_config) {
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
	 * @return {object} A cleaning object
	 * @abstract
	 * @example
	 * exports.init = function(node, app_config, main) {
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
	async _init(app_config) {
		if (this._state === "RUNNING") {
			console.log("Warning: App still running: doing reinit");
			return this._reinit(app_config);
		}
		this._node.connect_schema(this._schema);
		if (typeof app_config === "object" && app_config !== null) {
			this._config = app_config;
		}
		this._node.connect_config(app_config);
		if (this._struct && this._struct.deactive) {
			delete app._struct.deactive;
		}
		if (typeof this.init === "function") {
			try {
				this._object = await this.init(this._node,
						this._config, this._main);
			} catch (err) {
				if (err === "canceled") {
					return this;
				}
				this._handle_error(err);
				return this;
			}
			if (!this._node._announced) {
				const a = this._node.announce({});
				this._object = [a, this._object];
			}
		} else if (typeof this.cli !== "function") {
			console.warn("WARNING: No init and no cli function found:", this._app);
		}
		this.emit("init");

		this._state = "RUNNING";

		return this;
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
	_unload() {
		if (this._state.match(/^ERROR_/) || this._state === "DEACTIVE") {
			unload_object(this._object);
			this._object = null;

			this._node.connect_schema(null);
			this._node.connect_config(null);

			this._state = "UNLOADED";
			return;
		}
		if (this._state !== "RUNNING" && this._state !== "REINIT")
			return;

		this._node.connect_schema(null);
		this._node.connect_config(null);

		this.emit("unload");
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
	 * @abstract
	 */
	/**
	 * [internal use] Call reinit function
	 * @param {object} app_config - Config object
	 * @private
	 */
	_reinit(app_config) {
		const _this = this;
		console.log("restarting app:", this._id);

		if (typeof app_config !== "object" || app_config === null) {
			app_config = this._config;
		}

		if ((this._state === "RUNNING" || this._state === "REINIT_DELAYED")
				&& typeof this.reinit === "function") {
			this._state = "REINIT";
			this._node.connect_config(app_config);
			this._node._announced = null;
			this.reinit(this._node, this._config, this._main);
			if (!this._node._announced) {
				this._node.announce({}, true);
			}
			this._state = "RUNNING";
		} else {
			if (this._struct && this._struct.deactive) {
				delete this._struct.deactive;
			}
			this._unload();
			setImmediate(function() {
				_this._node.connect_config(app_config);
				_this._init(app_config);
			});
		}
		this.emit("reinit");
	};
	/**
	 * [internal use] Call reinit function with delay
	 * @param {number} delay - Delay in ms
	 * @param {object} app_config - Config object
	 * @private
	 */
	_reinit_delay(delay, app_config) {
		if (typeof delay !== "number")
			delay = 1000;

		if (this._state !== "RUNNING")
			throw new Error("Can only reinit running applications");

		const _this = this;
		this._state = "REINIT_DELAYED";
		setTimeout(function() {
			if (_this._state === "REINIT_DELAYED")
				_this._reinit(app_config);
		}, delay);
	};

	/**
	 * [internal use] Call init function
	 * @param {object} app_config - Config object
	 * @private
	 */
	_init_deactive(app_config) {
		if (typeof app_config === "object" && app_config !== null) {
			this._config = app_config;
		}

		this._state = "DEACTIVE";

		this._node.connect_schema(this._schema);
		this._node.connect_config(this._config);
		this._object = this._node.announce([this._config.metadata, {
			"type": "app.deactive",
			"state": this._state
		}]);
		return this;
	};

	/**
	 * [internal use] Call init function
	 * @param {object} app_config - Config object
	 * @private
	 */
	_init_error(app_config, state, error) {
		this._set_state(state, error, app_config);

		return this;
	};


	/**
	 * [internal use] Deactivate app
	 * @private
	 */
	_deactivate() {
		const _this = this;
		console.log("deactivating app:", this._id);

		this._unload();
		if (this._struct) {
			this._struct.deactive = true;
		}
		setImmediate(function() {
			_this._init_deactive();
		});

		this.emit("deactivate");
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
	 * @abstract
	 * @example
	 * exports.cli = function(args, show_help, main) {
	 *	if (show_help) {
	 *		console.group();
	 *		console.info(
	 *			'  --config [file]  Path to the config file\n' +
	 *			'                 (default: "osiota.json")\n' +
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
	_cli(args, show_help) {
		if (typeof this.cli === "function") {
			return this.cli(args, show_help, this._main);
		}
	};

	/**
	 * Reload an app by creating a new app object
	 * @param {function} callback - Triggered on loaded app
	 * @example
	 * app._config.node = "/newnodename";
	 * new_app = await app._reload();
	 */
	async _reload(callback) {
		if (!this._application_loader)
			throw new Error("No Application Loader instance provided");
		try {
			await this._application_loader.app_reload(this);
			if (callback) callback(null, this);
		} catch(err) {
			if (callback) return callback(err, this);
			throw err;
		}
		return this;
	};

	/**
	 * Get Application Name (from Schema)
	 */
	_get_app_name() {
		let locale = Intl.DateTimeFormat().resolvedOptions().locale.
			replace(/-.*$/, "");
		if (!locale) locale = "en";

		if (typeof this._schema === "object" &&
				this._schema !== null) {
			let r = null;
			if (typeof this._schema["gui_title_" + locale] === "string") {
				r = this._schema["gui_title_"+locale];
			}
			else if (typeof this._schema["title_" + locale] === "string") {
				r = this._schema["title_"+locale];
			}
			else if (typeof this._schema["gui_title"] === "string") {
				r = this._schema["gui_title"];
			}
			else if (typeof this._schema["title"] === "string") {
				r = this._schema["title"];
			}
			if (r && r !== "Settings") {
				r = r.replace(/^osiota application /i, "");
				return r;
			}

		}

		return this._app.
			replace(/^(er|osiota)-app-/, "").replace(/\//g, "-")
	};
};

exports.application = application;
