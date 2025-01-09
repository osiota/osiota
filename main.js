const Router = require("./router").router;
const Node = require("./router").node;
const NodeMap = require("./node_map.js").node_map;
const Application = require("./application.js").application;
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

var fmap = function(array, callback) {
	return array.reduce(function(acc, value, index, oa) {
		var n = callback.call(acc, value, index, oa);
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
	 * var m = new main("my osiota");
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
		var _this = this;

		update_config(config);

		// preparation:
		this._started = false;
		this._close = false;
		this._config = config;
		this.config_cleaning();

		if (typeof config.hostname !== "undefined") {
			this.router.name = config.hostname;
		}

		if (typeof config.auto_install === "boolean") {
			this.application_loader.auto_install = config.auto_install;
		}

		this.setup_history(config.save_history);

		// Load policy checker module
		this.router.policy_checker = new Policy_checker();
		if (typeof config.policies === 'object' &&
				Array.isArray(config.policies)){
			config.policies.forEach(function(policy) {
				_this.router.policy_checker.add_policy("user_level",
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
	config(config) {
		var _this = this;
		this.preparation_config(config);
		if (typeof this.os_config === "function") {
			this.os_config(config);
		}
		this.sub_config(config);

		this.check_started();
	};
	/**
	 * Load sub configurations
	 *
	 * @param {object} config - Configuration
	 * @param {node} node - Parent node
	 * @param {function} callback
	 */
	sub_config(config, node, callback) {
		var _this = this;

		// DEPRECATED:
		/* istanbul ignore next deprecated */
		if (Array.isArray(config.remote)) {
			config.remote.forEach(function(c) {
				if (typeof c.name !== "string" ||
						typeof c.url !== "string") {
					console.warn("Warning: Remote config options missing.", c);
					return;
				}
				_this.remotes[c.name] =
					_this.create_websocket_client(c.url, c.node, c);
			});
		}

		return this.application_loader.load(node, config.app, callback);
	};

	/**
	 * [internal] Check if instance is started
	 *
	 * @private
	 */
	/* istanbul ignore next abstract */
	check_started(factor) {
		var _this = this;
		/**
		 * Started event
		 *
		 * @event main#started
		 */
		var tid = setTimeout(function() {
			_this.started();
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
		var _this = this;
		var ws = require('./router_websocket_client').init(this, this.rpcstack, "", url);
		var remote_prefix = "";
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
			nodes.forEach(function(node) {
				ws.node_plocal(_this.router.node(node), "subscribe_announcement");
			});
		} else if (typeof nodes === "string") {
			ws.node_plocal(this.router.node(nodes), "subscribe_announcement");
		}

		// data from UPSTREAM
		if (Array.isArray(config.subscribe)) {
			config.subscribe.forEach(function(s) {
				ws.subscribe_announcement(_this.router.node(s));
			});
		} else if (typeof config.subscribe === "string") {
			/*
			 * NOTE: 'remote_basename' (see above) is added to
			 * 'config.subscribe'
			 */
			console.log("subscribe:", ws.remote_basename +config.subscribe);
			ws.subscribe_announcement(_this.router.node(config.subscribe));
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

		var _this = this;

		if (typeof config !== "object" || config === null) {
			return config;
		}

		config.__is_persistent = true;
		Object.defineProperty(config, '__is_persistent', {enumerable: false});

		if (typeof config.config === "object") {
			if (config.config.__remove_app) {
				return undefined;
			}
		}
		for (var k in config) {
			if (config.hasOwnProperty(k) &&
					typeof config[k] === "object") {
				if (Array.isArray(config[k])) {
					config[k] = fmap(config[k], function(c) {
						return _this.config_cleaning(c);
					});
				} else {
					var c = _this.config_cleaning(config[k]);
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
		var _this = this;
		if (this._close) return;
		this._close = true;
		console.log("osiota: closing");

		setImmediate(function() {
			_this.application_loader.close();

			for (var r in _this.remotes) {
				console.log("closing: remote", r);
				_this.remotes[r].close();
				delete _this.remotes[r];
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
		var _this = this;
		var config = this._config;
		this.close();

		console.log("\n\nRELOADING ...");
		var s = setTimeout(function() {
			var rname = config.hostname || _this.router.name;
			var m = new (Object.getPrototypeOf(_this)).constructor(rname);
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
		"Application": Application
	};
}

module.exports = main;

