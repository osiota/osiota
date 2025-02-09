const { ApplicationInterface } = require("./application_interface.js");

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

		if (typeof struct.name !== "string" &&
				typeof struct.name !== "function" &&
				typeof struct.name !== "object" &&
				struct.name !== null) {
			console.warn("Warning: Application name option missing.", struct, node && node.name);
			return null;
		}

		const ai = new ApplicationInterface(this._main, this, node, struct);
		const loaded_apps = await ai.start();

		return await Promise.all(loaded_apps);
	};

	/**
	 * [internal use] Register application to main
	 * @private
	 */
	app_register(ai) {
		const appname = ai.get_app_name();
		let app_identifier = appname;
		let app_increment = 2;
		while(this.apps.hasOwnProperty(app_identifier)) {
			app_identifier = appname + " " + app_increment++;
		}
		this.apps[app_identifier] = ai;

		/**
		 * Application added
		 *
		 * @event main#app_added
		 * @param {application} application - Applicaiton name
		 * @param {string} application_id - Id
		 */
		this.emit("app_added", ai, ai.app_id);

		return app_identifier;
	}

	/**
	 * [internal use] Unregister application to main
	 * @private
	 */
	app_unregister(app_identifier) {
		delete this.apps[app_identifier];
	};

	/**
	 * Stop all applications
	 */
	close() {
		for (const app_identifier in this.apps) {
			console.log("unloading:", app_identifier);
			if (this.apps[app_identifier] && this.apps[app_identifier].stop) {
				try {
					this.apps[app_identifier].stop();
				} catch(e) {
					console.error("Error unloading", e);
				}
				delete this.apps[app_identifier];
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
					node._app.state === ApplicationInterface.state_running &&
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

	install_app(appname, error) {
		return false;
	}
};
exports.application_loader = application_loader;

