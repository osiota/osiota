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
	 */
	async load(node, apps) {
		if (!Array.isArray(apps) || !apps.length) {
			return [];
		}
		const loaded_apps = [];
		for (const struct of apps) {
			try {
				const app = this.startup_struct(node, struct);
				loaded_apps.push(app);
			} catch(err) {
				console.error("Error in application loading:", err);
			}
		}
		return Promise.all(loaded_apps);
	}

	/**
	 * Startup an application by name and config
	 * @param {node} node - Parent node
	 * @param {string|application} app - Application Name or Application
	 * @param {object} app_config - Application Config
	 * @param {boolean} [auto_install] - Automatic Installation
	 * @param {boolean} [deactive] - Start as deactivated app
	 * @returns {string} Application name
	 */
	startup(node, app, app_config, auto_install, deactive) {
		const struct = {
			name: app,
			deactive: deactive,
			config: app_config,
		};
		if (node && node._app && node._app._struct) {
			struct = node._app._struct;
		}
		return this.startup_struct(node, struct, auto_install);
	};

	/**
	 * Startup an application by struct
	 * @param {node} node - Parent node
	 * @param {object} struct - Application Struct
	 * @param {boolean} [auto_install] - Automatic Installation
	 * @returns {string} Application name
	 */
	async startup_struct(node, struct, auto_install) {
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

		if (typeof struct.name !== "string" && typeof struct.name !== "object"
				&& struct.name !== null) {
			console.warn("Warning: Application name option missing.", struct, node && node.name);
			return null;
		}

		const app = struct.name;
		const app_config = struct.config;

		let loaded_apps;
		try {
			const a = await this.module_get(app);

			// load app (with or without error):
			loaded_apps = await this.startup_module( a, node,
					struct, auto_install);
		} catch(err) {
			const a = new Application(this, app);
			// announce error message:
			if (typeof a._config === "undefined") {
				a._config = app_config;
			}
			a._error = err;
			a._state = "ERROR_LOADING";

			// load app (with or without error):
			loaded_apps = await this.startup_module( a, node,
					struct, auto_install);


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
			let show_error = true;
			let callback;
			const promise = new Promise((resolve)=>{
				callback = resolve;
			});
			if (!this.emit("app_loading_error", err, a, node, app,
					app_config, auto_install,
					function(an, level) {
				if (typeof an === "object") {
					if (typeof callback === "function") {
						callback(an, level);
					}
				}
			})) {
				// assume that an other app as NOT been loaded.
				console.error("error starting app:", err);
			} else {
				// assume that an other app as been loaded.
				loaded_apps.push(promise);
			}

		}

		return await Promise.all(loaded_apps);
	};

	/**
	 * [internal use] Create Application Object and bind methods
	 * @private
	 */
	async module_get(app) {
		if (typeof app === "undefined" || app === null) {
			//return;
			throw new Error("app is undefined or null");
		} else if (typeof app === "string") {
			const appname = app.replace(/^(er|osiota)-app-/, "");
			console.log("loading:", appname);
			const a = new Application(this, appname);
			const struct = await this._main.require(appname);
			const schema = await this._main.load_schema(appname);
			// bind module:
			await a._bind_module(
				struct,
				this.module_get.bind(this)
			);
			await a._bind_schema(
				schema,
				this._main.load_schema.bind(this._main),
			);
			return a;
		} else if (typeof app === "object" && app !== null) {
			const a = new Application(this, app);
			await a._bind_module(
				app,
				this.module_get.bind(this)
			);
			return a;
		} else {
			throw new Error("variable app has unknown type.");
		}
	};

	/**
	 * [internal use] Bind application and initialize it
	 * @private
	 */
	async startup_module(a, node, struct, auto_install) {
		let app_config = struct.config;
		const deactive = struct.deactive;

		const appname = a._get_app_name();
		let app_identifier = appname;
		let app_increment = 2;
		while(this.apps.hasOwnProperty(app_identifier)) {
			app_identifier = appname + " " + app_increment++;
		}
		a._id = app_identifier;

		a._struct = struct;

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
		a._root = node;

		let node_base = node;
		if (typeof app_config.base === "string") {
			node_base = node.node(app_config.base);
		}

		let node_destination = null;
		let node_postname = "";
		if (typeof a.node_postname === "string") {
			node_postname = a.node_postname;
		}
		if (typeof app_config.node === "string") {
			node_destination = node_base.node(app_config.node + node_postname);
		} else if (typeof app_config.pnode === "string") {
			node_destination = node.node(app_config.pnode);
		} else if (typeof a.default_node_name === "string") {
			// TODO: Make this deprecated:
			node_destination = node_base.node(a.default_node_name);
		} else {
			node_destination = node_base.node(a._id);
		}

		if (node_destination._app &&
				a._app === node_destination._app._app) {
			// TODO: Is this still needed?
			a = node_destination._app;
		} else {
			a._node = node_destination;
			this.app_register(a);
		}

		a._base = node_base;

		// TODO TODO TODO: In seperate app?
		let node_source = node_base;
		if (typeof app_config.source === "string") {
			node_source = node_base.node(app_config.source);
		}
		let node_target = node_base;
		if (typeof app_config.target === "string") {
			node_target = node_base.node(app_config.target);
		}
		a._source = node_source;
		a._target = node_target;

		let app_promise;
		// init:
		try {
			if (deactive) {
				app_promise = a._init_deactive(app_config);

				//this.emit("app_init_deactive", a);

			} else if (a._error) {
				app_promise = a._init_error(app_config, a._state, a._error);
			} else {
				app_promise = a._init(app_config);

				const app_timeout = new Promise(resolve=>{
					const tid = setTimeout(resolve, 3000);
					tid.unref();
				});

				// Add Timeout
				app_promise = Promise.race([
					app_promise,
					app_timeout,
				]);
				/**
				 * Application init
				 *
				 * @event main#app_init
				 * @param {application} application - Application object
				 */
				//this.emit("app_init", a);
			}
		} catch(e) {
			// save error:
			app_promise = a._set_state("ERROR_STARTING", a._error, app_config);

			// show error:
			console.error("error starting app:", e);
		}
		const loaded_apps = [];
		loaded_apps.push(app_promise);

		// load child apps:
		const sub_apps = await this.load(node_destination, app_config.app)
		loaded_apps.push(...sub_apps);

		// TODO: UNLOAD:
		a._subapps = sub_apps;

		return loaded_apps;
	};

	/**
	 * [internal use] Register application to main
	 * @private
	 */
	app_register(a) {
		this.apps[a._id] = a;

		const appname = a._app;
		const node = a._node;

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

		const node = a._node;
		if (typeof node === "object" &&
				node !== null &&
				typeof node._app == "object" &&
				node._app === a) {
			delete node._app;
		}
	};

	/**
	 * Stop all applications
	 */
	close() {
		for (const a in this.apps) {
			console.log("unloading:", a);
			if (this.apps[a]._unload) {
				try {
					this.apps[a]._unload();
				} catch(e) {
					console.error("Error unloading", e);
				}
				delete this.apps[a];
			}
		}
	};



	app_add_helper(config, app, settings) {
		if (!Array.isArray(config.app)) {
			config.app = [];
		}
		const struct = {
			"name": app,
			"config": settings
		}
		this._main.config_cleaning(struct);

		config.app.push(struct);
		return struct;
	};

	async app_add(app, settings, node, config) {
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
				const struct_n = this.app_add_helper(config, "node", {
					"node": node.name
				});
				await this.startup_struct(node, struct_n);
				config = struct_n.config;
			}
		}

		const struct = this.app_add_helper(config, app, settings);
		return this.startup_struct(node, struct);
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

	reload_timeout = 1000;
	/**
	 * Reload an app by creating a new app object
	 * @param {application} app - Old app instance
	 * @example
	 * app._config.node = "/newnodename";
	 * new_app = application_loader.app_reload(app);
	 */
	async app_reload(app, timeout, callback) {
		console.log("APP_RELOAD");
		if (typeof callback === "undefined" &&
				typeof timeout === "function") {
			callback = timeout;
			timeout = undefined;
		}

		// buffer old references:
		const rnode = app._root;
		const aconfig = app._config;
		const aname = app._app;

		// unload app
		await app._unload();
		this.app_unregister(app);
		console.log("APP_RELOAD 2");

		//await sleep(timeout || 1000);
		await new Promise((resolve)=>setTimeout(resolve, timeout || this.reload_timeout));
		console.log("APP_RELOAD 3");

		// load app
		const loaded_apps = await this.load(rnode, [{
			"name": aname,
			"config": aconfig
		}]);
		console.log("APP_RELOAD 4");
		if (callback) callback(loaded_apps[0]);
		console.log("APP_RELOAD 5");
		return loaded_apps[0];
	};

};
exports.application_loader = application_loader;

