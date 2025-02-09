const { BaseApp } = require("./osiota-app.js");

/**
 * Example Application Class
 *
 * Example application with all possible methods.
 *
 * @tutorial doc/build_your_own_apps.md
 */
class ExampleApp extends BaseApp {
	/**
	 * Creates an Application
	 * @param {ApplicationInterface} application_interface - Application Interface Instance
	 */
	constructor(application_interface) {
		super(application_interface);
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
		console.info("INIT HALLO WELT", app_config);
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
		console.info("CLI HALLO WELT");
	}

	/**
	 * Get schema from application
	 *
	 * Helper function for application_interface.#load
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
		return auto_configure;
	}
};

exports.Application = ExampleApp;
