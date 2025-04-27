const EventEmitter = require('events').EventEmitter;
const unload_object = require("unload-object").unload;
const { ensure_promise } = require("./helper_promise.js");
const { sleep } = require('./helper_sleep.js');
const { merge } = require("./helper_merge_data.js");

const { LegacyApp } = require("./osiota-app.js");

/**
 * Application Interface Class
 *
 * This class is an interface between the osiota platform and an application.
 *
 * View from the platform. What does the platform want to do?
 *
 * Loading actions:
 * * load application (with schema)
 * * connect configuration (app_config, node)
 *
 * Life cycle actions:
 * * trigger start
 * * trigger deactivate – start as deactivated application
 * * trigger activate – start as deactivated application
 * * trigger restart
 * * trigger stop
 * * trigger delete
 * * update configuration (and restart)
 *
 * Actions from the application:
 * * application_error
 * * access nodes, configuration, etc.
 */
class ApplicationInterface extends EventEmitter {
	static state_uninited = "uninited";
	static state_loaded = "loaded";
	static state_starting = "starting";
	static state_running = "running";
	static state_reinit = "reinit";
	static state_unloaded = "unloaded";
	static state_deactive = "deactive";
	static state_error = "error";
	static state_error_loading = "error_loading";

	#state = "uninited";
	#error = null;

	#appname = "unknown";
	#module = null;
	#schema = null;
	#app = null;
	#config = null;
	#struct = null;
	#app_id = Math.random().toString(36).substring(2, 15) +
			   Math.random().toString(36).substring(2, 15);

	#loader = null;
	#main = null;
	#object = null;
	#subapps = null;
	#subapps_path = null;

	#node_root = null;
	#node = null;
	#node_base = null;
	#node_source = null;
	#node_target = null;

	/**
	 * Creates an application interface
	 *
	 * @param {main} main - Main instance (Dependency Injection)
	 * @param {application_loader} loader - Loader instance (Dependency Injection)
	 * @param {node} node_root - Root node to base the application on
	 * @param {object} struct - Application configuration
	 */
	constructor(main, loader, node_root, struct) {
		super();

		// dependancy injection:
		this.#main = main;
		this.#loader = loader;

		this.#node_root = node_root;

		if (typeof struct !== "object" || struct === null) {
			throw new Error("struct is not an object");
		}
		if (typeof struct.config !== "object" || struct === null) {
			struct.config = {};
		}
		this.#struct = struct;
	}

	/**
	 * Start application
	 */
	async start() {
		if (this.#state === ApplicationInterface.state_starting ||
			this.#state === ApplicationInterface.state_running) {
			if (await this.#do_restart()) {
				const sub_apps = await this.#load_subapps();
				return [this, ...sub_apps];
			}
		}
		// stop, if needed.
		await this.stop();

		let loading_error = null;
		try {
			await this.#load();
		} catch(err) {
			if (err.code === "OSIOTA_APP_NOT_FOUND" && await this.#loader.install_app(this.#struct.name, err)) {
				try {
					await this.#load();
				} catch(err) {
					console.error(this.#appname, "error loading app:",err);
					loading_error = err;
					this.#module = null;
					this.#schema = null;
				}
			} else {
				console.error("Loading", err);
				loading_error = err;
			}
		}
		this.#set_state(ApplicationInterface.state_loaded);

		this.#prepare();

		const app_promise = this.#startup(loading_error);
		const sub_apps = await this.#load_subapps();

		return [app_promise, ...sub_apps];
	}

	/**
	 * Restart application
	 */
	async restart() {
		return this.start();
	}

	/**
	 * Stop application
	 */
	async stop() {
		if (this.#state === ApplicationInterface.state_starting ||
			this.#state === ApplicationInterface.state_running ||
			this.#state === ApplicationInterface.state_reinit ||
			this.#state === ApplicationInterface.state_deactive ||
			this.#state === ApplicationInterface.state_error_loading ||
			this.#state === ApplicationInterface.state_error) {
			return this.#app_unload();
		}
	}

	/**
	 * Deactivate application
	 */
	async deactivate() {
		console.log("deactivating app:", this.#app_id);

		this.stop();
		if (this.#struct) {
			this.#struct.deactive = true;
		}
		await sleep(0);
		await this.start();

		this.emit("deactivate");
	};

	/**
	 * Activate application
	 */
	async activate() {
		console.log("activating app:", this.#app_id);

		if (this.#struct && this.#struct.deactive) {
			delete this.#struct.deactive;
		}
		await sleep(0);
		await this.start();
		this.emit("activate");
	};

	/**
	 * Modify application
	 */
	async modify(config) {
		throw new Error("not jet implemented");
		// check configuration by schema:
		if (typeof this.#schema === "object" &&
				this.#schema !== null) {
			if (!json_validate(this.#schema, config)) {
				throw new Error("invalid_config");
			}
		}

		// update config object:
		this.#struct.config = merge(this.#struct.config, config,
				["app", "node", "pnode", "source", "metadata",
				"self_app"]);

		// restart app:
		await this.restart();

		if (save) {
			a._main.emit("config_save");
			return "saved";
		}
		return "modified";
	}

	/**
	 * Delete application
	 */
	async delete() {
		// remove from config:
		this.#struct.__remove_app = true;

		// init config cleaning:
		this.#main.config_cleaning();

		// unload app:
		await this.stop();
	}

	/**
	 * Handle error from Application
	 */
	handle_error(error) {
		console.error(this.#appname, "Error on app:", error);
		const state = ApplicationInterface.state_error;
		this.#set_state(state, error);
		this.#node.announce([this.#config?.metadata, {
			"type": "app.error",
			"state": state,
			"error": error.stack || error
		}], true);
		this.emit("app_error", error);
	};

	/**
	 * Handle restart request from Application
	 */
	async handle_restart(delay = 5000) {
		await this.stop();
		await sleep(delay);
		return this.start();
	};

	/**
	 * CLI method
	 */
	async cli(args, show_help) {
		await this.#load();

		if (typeof this.#module?.cli !== "function") {
			throw new Error("No cli method defined for app "+this.#appname);
		}
		return this.#module.cli(args, show_help, this.#main);
	};

	/**
	 * Application name
	 */
	get appname() {
		return this.#appname;
	}
	/**
	 * Application name (deprecated)
	 *
	 * @deprecated
	 */
	get _app() {
		return this.#appname;
	}

	/**
	 * Application identifier
	 */
	get app_id() {
		return this.#app_id;
	}
	/**
	 * Application identifier (deprecated)
	 *
	 * @deprecated
	 */
	get _id() {
		return this.#app_id;
	}

	/**
	 * Application state
	 */
	get state() {
		return this.#state;
	}

	/**
	 * Application schema
	 */
	get schema() {
		return this.#schema;
	}
	set schema(schema) {
		this.#schema = schema;
		if (this.#node) {
			this.#node.connect_schema(this.#schema);
		}
	}

	/**
	 * Destination node
	 */
	get node() {
		return this.#node;
	}

	/**
	 * Base node
	 */
	get node_base() {
		return this.#node_base;
	}

	/**
	 * Source node
	 */
	get node_source() {
		return this.#node_source;
	}

	/**
	 * Target node
	 */
	get node_target() {
		return this.#node_target;
	}

	/**
	 * Application configuration
	 */
	get config() {
		return this.#struct.config;
	}

	/**
	 * Main instance
	 */
	get main() {
		return this.#main;
	}

	/**
	 * App instance
	 */
	get instance() {
		return this.#app;
	}

	/**
	 * Get Application Name (from Schema)
	 *
	 * Helper function for app_register()
	 */
	get_app_name() {
		let locale = Intl.DateTimeFormat().resolvedOptions().locale.
			replace(/-.*$/, "");
		if (!locale) locale = "en";

		if (typeof this.#schema === "object" &&
				this.#schema !== null) {
			let r = null;
			if (typeof this.#schema["gui_title_" + locale] === "string") {
				r = this.#schema["gui_title_" + locale];
			}
			else if (typeof this.#schema["title_" + locale] === "string") {
				r = this.#schema["title_" + locale];
			}
			else if (typeof this.#schema["gui_title"] === "string") {
				r = this.#schema["gui_title"];
			}
			else if (typeof this.#schema["title"] === "string") {
				r = this.#schema["title"];
			}
			if (r && r !== "Settings") {
				r = r.replace(/^osiota application /i, "");
				return r;
			}
		}
		if (this.#appname.match(/^unknown/)) {
			if (typeof this.#module?.name === "string" &&
					!this.#module.name.match(/^Legacy/)) {
				return this.#module.name;
			}
		}

		return this.#appname.
			replace(/^(er|osiota)-app-/, "").replace(/\//g, "-")
	}

	#set_state(state, error) {
		this.#state = state;
		this.#error = error;
	}

	async #load() {
		if (this.#module && this.#schema) return;

		const app = this.#struct.name;
		if (typeof app === "undefined" || app === null) {
			//return;
			throw new Error("app is undefined or null");
		} else if (typeof app === "string") {
			const appname = app.replace(/^(er|osiota)-app-/, "");
			this.#appname = appname;
			console.log("loading:", appname);

			const promise_module = this.#main.require(appname);
			const promise_schema = this.#main.load_schema(appname);

			this.#module = await promise_module;
			if (typeof this.#module.Application === "function" ||
					typeof this.#module.Application === "object") {
				this.#module = this.#module.Application;
			}
			this.#schema = await promise_schema;
		} else if (typeof app === "object" && app !== null) {
			this.#module = app;
			this.#schema = {};
		} else if (typeof app === "function") {
			this.#module = app;
			this.#schema = {};
		} else {
			throw new Error("variable app has unknown type.");
		}

		if (typeof this.#module.prototype !== "object") {
			const LegacyAppModule = class extends LegacyApp {}
			await this.#legacy_bind_module(LegacyAppModule, this.#module, this.#main.require.bind(this.#main));
			this.#module = LegacyAppModule;
		}

		if (typeof this.#module.get_schema === "function") {
			const new_schema = await ensure_promise(this.#module.get_schema.bind(this.#module), this.#schema, this.#main.load_schema.bind(this.#main));
			if (new_schema) {
				this.#schema = new_schema;
			}
		}
	};

	async #legacy_inherit(target, inherit, loader) {
		if (Array.isArray(!inherit) || !inherit.length ) {
			return null;
		}
		const iname = inherit.shift();
		if (typeof iname !== "string") {
			throw new Error("inherit: application name is not string.");
		}

		const m = await loader(iname);

		if (typeof target.prototype._super !== "object") {
			target.prototype._super = {};
		}
		target.prototype._super[iname] = m;
		await this.#legacy_bind_module(target, m, loader);
		await this.#legacy_inherit(target, inherit, loader);
		return this;
	};

	async #legacy_bind_module(target, module, loader){
		if (typeof module !== "object" || module === null) {
			throw new Error("module is not an object");
		}
		if (typeof module.inherit === "object" &&
				Array.isArray(module.inherit) &&
				module.inherit.length) {
			const inherit = module.inherit.slice(0);
			await this.#legacy_inherit(target, inherit, loader);
		}
		this.#legacy_bind_module_sync(target, module);
		return this;
	};
	#legacy_bind_module_sync(target, module) {
		Object.keys(module).forEach(key => {
			if (key === "cli" || key === "get_schema" ||
					key === "auto_configure" ||
					key === "node_postname" ||
					key === "default_node_name") {
				target[key] = module[key];
			} else {
				target.prototype[key] = module[key];
			}
		});
		return this;
	};

	#prepare() {
		let node = this.#node_root;

		//move to: app_register
		this.#app_id = this.#loader.app_register(this);

		console.log("startup:", this.#appname);

		const app_config = this.#struct.config;

		if (Object.keys(app_config).length == 0 &&
				typeof this.#module?.auto_configure === "function") {
			this.#module.auto_configure(app_config, this.#main);
		}

		if (typeof node !== "object" || node === null) {
			node = this.#main.node("/app");
		}

		this.#node_base = node;
		if (typeof app_config.base === "string") {
			this.#node_base = node.node(app_config.base);
		}

		let node_destination = null;
		let node_postname = "";
		if (typeof this.#module?.node_postname === "string") {
			node_postname = this.#module.node_postname;
		}
		if (typeof app_config.node === "string") {
			node_destination = this.#node_base.node(app_config.node + node_postname);
		} else if (typeof app_config.pnode === "string") {
			node_destination = node.node(app_config.pnode);
		} else if (typeof this.#module?.default_node_name === "string") {
			// TODO: Make this deprecated:
			node_destination = this.#node_base.node(this.#module.default_node_name);
		} else {
			node_destination = this.#node_base.node(this.#app_id);
		}

		this.#node = node_destination;

		// TODO TODO TODO: In seperate app?
		this.#node_source = this.#node_base;
		if (typeof app_config.source === "string") {
			this.#node_source = this.#node_base.node(app_config.source);
		}
		this.#node_target = this.#node_base;
		if (typeof app_config.target === "string") {
			this.#node_target = this.#node_base.node(app_config.target);
		}

		this.#register_node();

		return this;
	};

	#register_node() {
		const node = this.#node;

		if (this.#appname === "node") {
			if (!node._app) {
				node._app = this;
			}
			return;
		}

		if (node._app &&
				node._app.appname !== "node") {
			console.warn("There is already an app bind " +
				"to that node:", node.name,
				"(", this.#appname, "vs", node._app.appname, ")");
		}
		node._app = this;
	};
	#unregister_node() {
		const node = this.#node;
		if (typeof node === "object" &&
				node !== null &&
				typeof node._app == "object" &&
				node._app === this) {
			delete node._app;
		}
	};

	#init_node(type, error) {
		if (this.#node) {
			this.#node.connect_schema(this.#schema);
			this.#node.connect_config(this.#struct.config);
			if (type) {
				this.#object = this.#node.announce([this.#struct.config.metadata, {
					"type": type,
					"state": this.#state,
					"error": error && error.stack || error
				}]);
			}
		}
	}

	async #startup(loading_error) {
		const app_config = this.#struct.config;

		let app_promise;
		// init:
		try {
			if (loading_error) {
				app_promise = this.#app_init_error(ApplicationInterface.state_error_loading, loading_error);
			} else if (this.#struct.deactive) {
				app_promise = this.#app_init_deactive();
			} else {
				const app_timeout = new Promise(resolve=>{
					const tid = setTimeout(resolve, 3000);
					tid.unref();
				});

				// Add Timeout
				app_promise = Promise.race([
					this.#app_init(),
					app_timeout,
				]);
			}
		} catch(err) {
			// show error:
			console.error("error starting app:", err);

			app_promise = this.#app_init_error(ApplicationInterface.state_error, err);
		}
		return app_promise;
	};

	async #load_subapps() {
		if (this.#subapps) {
			if (this.#node === this.#subapps_path) {
				return this.#subapps;
			}
			await unload_object(this.#subapps);
			await sleep(1000);
		}
		this.#subapps = this.#loader.load(this.#node,
				this.#struct.config.app);
		this.#subapps_path = this.#node;

		return this.#subapps;
	};

	async #app_init() {
		const app_config = this.#struct.config;
		this.#init_node();

		const a = new this.#module(this, this.#main, app_config);
		this.#app = a;

		if (typeof a.init !== "function") {
			throw new Error("No init function found in app " + this.#appname);
		}

		try {
			this.#object = await a.init(this.#node,
					app_config, this.#main);
		} catch (err) {
			if (err === "canceled") {
				return this;
			}
			this.handle_error(err);
			return this;
		}
		if (!this.#node._announced) {
			this.#node.announce({});
			this.#object = [this.#node, this.#object];
		}
		this.emit("init");
		/**
		 * Application init
		 *
		 * @event main#app_init
		 * @param {application} application - Application object
		 */
		//this.emit("app_init", this);

		this.#set_state(ApplicationInterface.state_running);

		return this;

	};
	async #app_init_deactive() {
		this.#set_state(ApplicationInterface.state_deactive);

		this.#init_node("app.deactive");
		this.emit("init_deactive");

		return this;
	};
	async #app_init_error(state, error) {
		this.#set_state(state, error);

		this.#init_node("app.error", error);
		this.emit("init_error", error);

		return this;
	};
	async #do_restart() {
		const a = this.#app;
		if (a && typeof a.reinit === "function") {
			this.#set_state(ApplicationInterface.state_reinit);
			this.#node.connect_config(this.#struct.config);
			this.#node._announced = null;
			try {
				await a.reinit(this.#node, this.#config, this.#main);
			} catch(err) {
				this.handle_error(err);
			}
			if (!this.#node._announced) {
				this.#node.announce({}, true);
			}
			this.#set_state(ApplicationInterface.state_running);
			return true;
		}
		return false;
	};
	#app_unload() {
		if (this.#node) {
			this.#unregister_node();

			this.#node.connect_schema(null);
			this.#node.connect_config(null);
		}

		const a = this.#app;
		try {
			if (a && typeof a.unload === "function") {
				a.unload(this.#object, unload_object);
			} else {
				unload_object(this.#object);
			}
			this.#object = null;
		} catch(err) {
			console.error("Error unloading", err);
		}
		this.#app = null;

		this.#loader.app_unregister(this.app_id);

		this.emit("unload");

		this.#set_state(ApplicationInterface.state_unloaded);
	}

};

exports.ApplicationInterface = ApplicationInterface;
