const EventEmitter = require('events').EventEmitter;

/**
 * Base Application Class
 *
 * Osiota can run applications. This is the base app every application
 * shall be extended from. An application is started, when the `init()`
 * function is called by osiota.
 *
 * @tutorial doc/build_your_own_apps.md
 */
class BaseApp extends EventEmitter {
	/**
	 * Creates a Base Application
	 * @param {ApplicationInterface} application_interface - Application Interface Instance
	 */
	constructor(application_interface) {
		super();

		this._application_interface = application_interface;
		this._main = application_interface.main;

		this._config = application_interface.config;

		this._base = application_interface.node_base;
		this._node = application_interface.node;
	}

	/**
	 * Init method
	 *
	 * @param {object} app_config - Config object
	 * @param {node} node - Node object
	 * @param {main} main - Main instance
	 * @return {object} A object for unloading
	 * @example
	 * init(node, app_config) {
	 *     node.announce({ type: "my.app" });
	 *     node.publish(undefined, 123);
	 *
	 *     return [node];
	 * };
	 */
	async init(node, app_config) {
	}

	/**
	 * Init method
	 *
	 * @param {object} object - Object to destroy
	 * @param {function} unload_object – Helper function for unloading
	 */
	unload(object, unload_object) {
		unload_object(object);
	}

	/**
	 * CLI method
	 *
	 * This method is called from the command line interface (cli) when
	 * `osiota --app myapp` is executed.
	 *
	 * @param {object} args - Command line arguments
	 * @param {boolean} show_help - Show help message
	 * @param {main} main - Main instance
	 * @example
	 * static cli(args, show_help, main) {
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
	static cli(args, show_help, main) {
		throw new Error("Not implemented");
	}

	/**
	 * Get schema from application
	 *
	 * Helper function for application_interface.#load
	 *
	 * @param {object} schema - The loaded schema
	 * @param {function} load_schema - Helper function to load schemas.
	 */
	static async get_schema(schema, load_schema) {
		return schema;
	}

	/**
	 * Auto configure application
	 *
	 * This method is called before the init function when no configuration
	 * was provided.
	 *
	 * @param {object} app_config - (The empty) config object
	 */
	static auto_configure(app_config) {
		return app_config;
	}

	/**
	 * Default node name
	 *
	 * @type {string}
	 */
	static default_node_name = undefined;

	/**
	 * Add postname to node name
	 *
	 * @type {string}
	 * @deprecated
	 */
	static node_postname = undefined;
}

/**
 * Convert Application Class
 *
 * This is the a base app an application can be extended from. It calculates
 * based on a source node.
 *
 * @tutorial doc/build_your_own_apps.md
 */
class ConvertApp extends BaseApp {
	/**
	 * Creates a Convert Application
	 * @param {ApplicationInterface} application_interface - Application Interface Instance
	 */
	constructor(application_interface) {
		super(application_interface);

		if (typeof this._config.source === "string") {
			this._source = this._base.node(this._config.source);
		} else {
			this._source = this._base;
		}
	}
}


/**
 * Push Application Class
 *
 * This is the a base app an application can be extended from. It pushes
 * information to a target node.
 *
 * @tutorial doc/build_your_own_apps.md
 */
class PushApp extends BaseApp {
	/**
	 * Creates a Push Application
	 * @param {ApplicationInterface} application_interface - Application Interface Instance
	 */
	constructor(application_interface) {
		super(application_interface);

		if (typeof this._config.target === "string") {
			this._target = this._base.node(this._config.target);
		} else {
			this._target = this._base;
		}
	}
}

/**
 * Connect Application Class
 *
 * This is the a base app an application can be extended from. It connects
 * a source to a target node.
 *
 * @tutorial doc/build_your_own_apps.md
 */
class ConnectApp extends BaseApp {
	/**
	 * Creates a Connect Application
	 * @param {ApplicationInterface} application_interface - Application Interface Instance
	 */
	constructor(application_interface) {
		super(application_interface);

		if (typeof this._config.source === "string") {
			this._source = this._base.node(this._config.source);
		} else {
			this._source = this._base;
		}

		if (typeof this._config.target === "string") {
			this._target = this._base.node(this._config.target);
		} else {
			this._target = this._base;
		}
	}
}


/**
 * Connect Application Class
 *
 * This is the a legacy app, that is used as parent class for all old osiota
 * apps.
 *
 * @tutorial doc/build_your_own_apps.md
 * @deprecated
 */
class LegacyApp extends ConnectApp {
	/**
	 * Creates a Legacy Application
	 * @param {ApplicationInterface} application_interface - Application Interface Instance
	 */
	constructor(application_interface) {
		super(application_interface);

		this._main = application_interface.main;
		this._schema = application_interface.schema;
	}
}

exports.BaseApp = BaseApp;
exports.ConvertApp = ConvertApp;
exports.PushApp = PushApp;
exports.ConnectApp = ConnectApp;
exports.LegacyApp = LegacyApp;

