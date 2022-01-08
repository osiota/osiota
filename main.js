var Router = require("./router").router;
var Node = require("./router").node;
var NodeMap = require("./node_map.js").node_map;
var Application = require("./application.js").application;
var application_loader = require("./application_loader.js").application_loader;
var Policy_checker = require("./module_policycheck.js").Policy_checker;

var addins = require("./addins.js").addins;

var merge = require("./helper_merge_data.js").merge;
var helper = require("./helper.js");

var EventEmitter = require('events').EventEmitter;
var util = require('util');

require('./module_history_class_memory.js');
require('./module_history_class_remote.js');
require('./module_history_class_timebase.js');
require('./module_history_class_filter.js');

/**
 * Main Process Instance
 * @class
 * @classdesc Remote Process Instance
 * @name main
 * @param {string} router_name - Name of the instance
 * @example
 * // create a new instance:
 * var m = new main("my osiota");
 */
function main(router_name) {
	EventEmitter.call(this);

	this._config = {};
	this._system_start = new Date();

	this.helper = helper;

	this.router = new Router(router_name);
	this.application_loader = new application_loader(this);
	this.apps = this.application_loader.apps;

	// startup: DEPRICATED
	this.startup = this.application_loader.startup.bind(this.application_loader);
	// startup_struct: DEPRICATED
	this.startup_struct = this.application_loader.startup_struct.bind(this.application_loader);

	addins(this);

	this.remotes = {};
};
util.inherits(main, EventEmitter);

main.prototype.classes = {
	"Router": Router,
	"Node": Node,
	"NodeMap": NodeMap,
	"Application": Application
};

main.prototype.unload_object = unload_object;

main.prototype.preparation_config = function(config) {
	var _this = this;

	// preparation:
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
main.prototype.config = function(config) {
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
main.prototype.sub_config = function(config, node, callback) {
	var _this = this;

	if (typeof config.connect === "object") {
		this.router.connectArray(config.connect);
	}

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
main.prototype.check_started = function(factor) {
	var _this = this;
	/**
	 * Started event
	 *
	 * @event main#started
	 */
	var tid = setTimeout(function() {
		if (_this._close) return;
		_this.emit("started");
	}, 500);
	if (tid && typeof tid.unref === "function" &&
			this.listenerCount("started") == 0) {
		tid.unref();
	}
};

/**
 * [internal] Setup history modules
 *
 * @private
 */
main.prototype.setup_history = function(save_history) {
	// Load history module
	var dbdir = "./.level_db/";
	if (save_history && typeof save_history === "object") {
		if (typeof save_history.dbdir === "string") {
			dbdir = save_history.dbdir;
		}
	}
	if (!this.history_config)
	this.history_config = {
		"type": "global",
		"submodules": [{
			"type": "timebase",
			"interval": 60,
			"submodules": [{
				"type": "timebase",
				"interval": 3600,
				"submodules": [{
					"type": "timebase",
					"interval": 3600*24,
					"submodules": [{
						"type": "file",
						"dbdir": dbdir,
						"filename": "1d.vdb"
					}]
				},{
					"type": "file",
					"dbdir": dbdir,
					"filename": "60min.vdb"
				}]
			},{
				"type": "file",
				"dbdir": dbdir,
				"filename": "60sec.vdb"
			}]
		},{
			"type": "memory",
			"max_data": 3000
		},{
			"type": "file",
			"dbdir": dbdir,
			"filename": "0.vdb"
		},{
			"type": "remote"
		}]
	};
	if (save_history) {
		require('./module_history_class_file.js');
	}
	require('./module_history.js').init(this.router, this.history_config);
}

/**
 * [internal] Create Websocket client
 *
 * @todo TODO: Move code!
 * @deprecated
 * @private
 */
main.prototype.create_websocket_client = function(url, nodes, config) {
	var ws = require('./router_websocket_client').init(this.router, "", url);
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
			ws.node_plocal("/", "subscribe_announcement");
		}
		nodes.forEach(function(node) {
			ws.node_plocal(node, "subscribe_announcement");
		});
	} else if (typeof nodes === "string") {
		ws.node_plocal(nodes, "subscribe_announcement");
	} else if (nodes !== false) {
		ws.node_plocal("/", "subscribe_announcement");
	}

	// data from UPSTREAM
	if (Array.isArray(config.subscribe)) {
		config.subscribe.forEach(function(s) {
			ws.subscribe_announcement(s);
		});
	} else if (typeof config.subscribe === "string") {
		/*
		 * NOTE: 'remote_basename' (see above) is added to
		 * 'config.subscribe'
		 */
		console.log("subscribe:", ws.remote_basename +config.subscribe);
		ws.subscribe_announcement(config.subscribe);
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
main.prototype.node = function(name) {
	return this.router.node(name);
};

/**
 * Require Module
 * @param {string} appname - Application name
 * @param {function} callback
 * @abstract
 */
main.prototype.require = function(appname, callback) {
	throw new Error("Require function not supported.");
};

/**
 * Load schema file
 * @param {string} appname - Application name
 * @param {function} callback
 * @abstract
 */
main.prototype.load_schema = function(appname, callback) {
	throw new Error("Load schema function not supported.");
};



var fmap = function(array, callback) {
	return array.reduce(function(acc, value, index, oa) {
		var n = callback.call(acc, value, index, oa);
		if (typeof n !== "undefined") {
			acc.push(n)
		}
		return acc;
	}, []);
};

main.prototype.config_cleaning = function(config) {
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

main.prototype.config_update = function(new_config, config) {
	if (typeof config === "undefined") {
		config = this._config;
	}

	config = merge(config, new_config);

	return config;
};

/**
 * close main instance
 */
main.prototype.close = function() {
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

		if (_this.wss) {
			console.log("closing: websocket server");
			_this.wss.close();
			_this.wss = undefined;
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
main.prototype.reload = function(callback) {
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
};

module.exports = main;

