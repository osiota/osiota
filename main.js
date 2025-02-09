const Router = require("./router").router;
const Node = require("./router").node;
const NodeMap = require("./node_map.js").node_map;
const application_loader = require("./application_loader.js").application_loader;
const Policy_checker = require("./module_policycheck.js").Policy_checker;

const addins = require("./addins.js").addins;

const merge = require("./helper_merge_data.js").merge;
const helper = require("./helper.js");

const update_config = require("./helper_config_update.js").update_config;

const EventEmitter = require('events').EventEmitter;

require('./module_history_class_memory.js');
require('./module_history_class_remote.js');
require('./module_history_class_timebase.js');
//require('./module_history_class_filter.js'); //unused??

const fmap = function(array, callback) {
	return array.reduce((acc, value, index, oa)=>{
		const n = callback.call(acc, value, index, oa);
		if (typeof n !== "undefined") {
			acc.push(n)
		}
		return acc;
	}, []);
};


/**
 * Main Process Instance
 * @extends EventEmitter
 */
class main extends EventEmitter {
	/**
	 * Create a main instance
	 * @param {string} router_name - Name of the instance
	 * @example
	 * // create a new instance:
	 * const m = new main("my osiota");
	 */
	constructor(router_name) {
		super();

		this._config = {};
		this._system_start = new Date();

		this.helper = helper;

		this.router = new Router(router_name);
		this.rpcstack = this.router.rpcstack;
		this.application_loader = new application_loader(this);
		this.apps = this.application_loader.apps;

		// startup: DEPRICATED
		this.startup = this.application_loader.startup.bind(this.application_loader);
		// startup_struct: DEPRICATED
		this.startup_struct = this.application_loader.startup_struct.bind(this.application_loader);

		addins(this);

		this.remotes = {};
	};

	preparation_config(config) {
		update_config(config);

		// preparation:
		this._started = false;
		this._close = false;
		this._config = config;
		this.config_cleaning();

		if (typeof config.hostname !== "undefined") {
			this.router.name = config.hostname;
		}

		this.setup_history(config.save_history);

		// Load policy checker module
		this.router.policy_checker = new Policy_checker();
		if (typeof config.policies === 'object' &&
				Array.isArray(config.policies)){
			config.policies.forEach((policy)=>{
				this.router.policy_checker.add_policy("user_level",
						policy);
			});
		}
	};

	/**
	 * Load a configuration
	 *
	 * @param {object} config - Configuration
	 * @fires main#started
	 */
	async config(config) {
		this.loaded = this.#config(config);

		this.check_started();

		return this.loaded;
	};

	async #config(config) {
		this.preparation_config(config);
		if (typeof this.os_config === "function") {
			await this.os_config(config);
		}
		await this.sub_config(config);

		console.log("All apps loaded.");
	};
	/**
	 * Load sub configurations
	 *
	 * @param {object} config - Configuration
	 * @param {node} node - Parent node
	 * @param {function} callback
	 */
	async sub_config(config, node, callback) {
		return this.application_loader.load(node, config.app, callback);
	};

	/**
	 * [internal] Check if instance is started
	 *
	 * @private
	 */
	/* istanbul ignore next abstract */
	check_started(factor) {
		/**
		 * Started event
		 *
		 * @event main#started
		 */
		const tid = setTimeout(()=>{
			this.started();
		}, 500);
		if (tid && typeof tid.unref === "function" &&
				this.listenerCount("started") == 0) {
			tid.unref();
		}
	};

	/**
	 * [internal] Run when instance is started
	 *
	 * @private
	 */
	started() {
		if (this._close) return;
		console.log("started");
		this._started = true;
		this.emit("started");
	};

	/**
	 * [internal] Setup history modules
	 *
	 * @private
	 */
	setup_history(save_history) {
		return require('./module_history.js').setup(this.router, save_history, this.history_config);
	}

	/**
	 * [internal] Create Websocket client
	 *
	 * Move code to app: ws
	 *
	 * @deprecated
	 * @private
	 */
	/* istanbul ignore next deprecated */
	create_websocket_client(url, nodes, config) {
		const ws = require('./router_websocket_client').init(this, this.rpcstack, "", url);
		let remote_prefix = "";
		if (typeof config.remote_prefix === "string") {
			remote_prefix = config.remote_prefix;
		}
		if (typeof config.remote_basename === "string") {
			ws.remote_basename = remote_prefix + config.remote_basename;
		} else {
			ws.remote_basename = remote_prefix + "/" + this.router.name;
		}
		if (typeof config.basename === "string") {
			ws.basename = config.basename;
		}

		// data to UPSTREAM
		if (Array.isArray(nodes)) {
			if (!nodes.length) {
				ws.node_plocal(this.router.node("/"), "subscribe_announcement");
			}
			nodes.forEach((node)=>{
				ws.node_plocal(this.router.node(node), "subscribe_announcement");
			});
		} else if (typeof nodes === "string") {
			ws.node_plocal(this.router.node(nodes), "subscribe_announcement");
		}

		// data from UPSTREAM
		if (Array.isArray(config.subscribe)) {
			config.subscribe.forEach((s)=>{
				ws.subscribe_announcement(this.router.node(s));
			});
		} else if (typeof config.subscribe === "string") {
			/*
			 * NOTE: 'remote_basename' (see above) is added to
			 * 'config.subscribe'
			 */
			console.log("subscribe:", ws.remote_basename +config.subscribe);
			ws.subscribe_announcement(this.router.node(config.subscribe));
		}

		if (config.secure === true || config.secure === "true") {
			this.router.policy_checker.add_observed_connection(ws.wpath);
		}

		return ws;
	};

	/**
	 * Get a node instance (format to router instance)
	 * @param {string} name - Name of the node
	 * @returns {node}
	 */
	node(name) {
		return this.router.node(name);
	};

	/**
	 * Require Module
	 * @param {string} appname - Application name
	 * @param {function} callback
	 * @abstract
	 */
	/* istanbul ignore next is abstract */
	require(appname, callback) {
		throw new Error("Require function not supported.");
	};

	/**
	 * Load schema file
	 * @param {string} appname - Application name
	 * @param {function} callback
	 * @abstract
	 */
	/* istanbul ignore next is abstract */
	load_schema(appname, callback) {
		throw new Error("Load schema function not supported.");
	};

	config_cleaning(config) {
		if (typeof config === "undefined") {
			config = this._config;
		}

		if (typeof config !== "object" || config === null) {
			return config;
		}

		config.__is_persistent = true;
		Object.defineProperty(config, '__is_persistent', {enumerable: false});

		if (typeof config === "object") {
			if (config.__remove_app) {
				return undefined;
			}
		}
		for (const k in config) {
			if (config.hasOwnProperty(k) &&
					typeof config[k] === "object") {
				if (Array.isArray(config[k])) {
					config[k] = fmap(config[k], (c)=>{
						return this.config_cleaning(c);
					});
				} else {
					const c = this.config_cleaning(config[k]);
					if (typeof c === "undefined") {
						delete config[k];
					} else {
						config[k] = c;
					}
				}
			}
		}

		return config;
	};

	config_update(new_config, config) {
		if (typeof config === "undefined") {
			config = this._config;
		}

		config = merge(config, new_config);

		return config;
	};

	/**
	 * close main instance
	 */
	close() {
		if (this._close) return;
		this._close = true;
		console.log("osiota: closing");

		setImmediate(()=>{
			this.application_loader.close();

			for (const r in this.remotes) {
				console.log("closing: remote", r);
				this.remotes[r].close();
				delete this.remotes[r];
			}
		});
	};

	/**
	 * Reload configuration
	 *
	 * @param {function} callback
	 * @example
	 * main.reload(function(m) {
	 *	main = m;
	 * });
	 */
	reload(callback) {
		const config = this._config;
		this.close();

		console.log("\n\nRELOADING ...");
		const s = setTimeout(()=>{
			const rname = config.hostname || this.router.name;
			const m = new (Object.getPrototypeOf(this)).constructor(rname);
			m.config(config);
			if (typeof callback === "function")
				callback(m);
		}, 1000);
		return s;
	};

	static classes = {
		"Router": Router,
		"Node": Node,
		"NodeMap": NodeMap,
	};
}

module.exports = main;

