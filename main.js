var Router = require("./router").router;
var Node = require("./router").node;
var Policy_checker = require("./module_policycheck.js").Policy_checker;
var Application = require("./application.js").application;
var NodeMap = require("./node_map.js").node_map;
var unload_object = require("./helper_unload_object.js").unload_object;

var merge = require("./helper_merge_data.js").merge;
var helper = require("./helper.js");
var async_calls = require("./helper_async_calls.js").async_calls;

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

	var _this = this;
	Node.prototype.app = function(app, app_config) {
		return _this.startup(this, app, app_config);
	};

	this.map_app = function(metadatatype) {
		var subapp = {};
		subapp.init = function(node, app_config, main, host_info) {
			node.announce({
				"type": metadatatype
			});
			this._source.subscribe(function() {
				node.publish(this.time, this.value);
			});
			var _this = this;
			node.rpc_set = function(reply, value) {
				_this._source.rpc_set(reply, value);
			};
			return node;
		};
		return subapp;
	};
	Node.prototype.map = function(config, app, map_extra_elements,
			map_key, map_initialise) {
		var node = this;
		var map = new NodeMap(node, config, app, map_extra_elements);

		if (typeof map_initialise === "function") {
			map.map_initialise = map_initialise;
		}
		if (typeof map_key === "function") {
			map.map_key = map_key;
		}
		map.init();

		return map;
	};
	Node.prototype.property = function(name, type, callback, default_value){
		if (typeof default_value === "undefined")
			default_value = null;

		var e = this.node(name);
		e.rpc_set = function(reply, value) {
			if (value === null) {
				value = default_value;
			} else {
				if (typeof type === "string") {
					if (typeof value !== type) {
						throw new Error("Wrong data "+
								"type");
					}
				} else {
					// TODO: Check schema
				}
			}
			this.publish(undefined, value);
			if (typeof callback === "function") {
				callback(value);
			}
			reply(null, "okay");
		};
		e.rpc_publish = function(reply, time, value) {
			return this.rpc_set(reply, value);
		};

		// set default value:
		e.rpc("set", null);

		var ltype = type;
		var schema;
		if (typeof ltype !== "string") {
			ltype = "schema";
			schema = type;
		} else {
			schema = {
				"type": type
			};
		}
		e.announce({
			"type": ltype+".property",
			"property": true,
			"schema": schema,
			"rpc": {
				"set": {
					"desc": "Set",
					"args": [true]
				}
			}
		});

		return e;
	};
	// todo: use subkey
	Node.prototype.subnode = function(property, type) {
		var _this = this;
		var n = this.node(property);

		var value = null;
		var s = this.subscribe(function() {
			var v = null;
			value = this.value;
			if (typeof value === "object" &&
					value !== null) {
				v = value[property];
			}
			n.publish(this.time, v);
		});
		n.rpc_set = function(reply, v) {
			if (type && typeof v !== type) {
				throw new Error("Type does not match target.");
			}
			if (typeof value !== "object" || value === null) {
				value = {};
			}
			value[property] = v;

			_this.rpc("set", value);
			//_this.publish(undefined, value);

			reply(null, "okay");
		};
		n.rpc_publish = function(reply, time, value) {
			this.rpc_set(reply, value);
		};
		var ltype = type;
		if (typeof ltype !== "string") {
			ltype = "schema";
			schema = type;
		} else {
			schema = {
				"type": type
			};
		}
		n.announce({
			"type": ltype+".property",
			"schema": schema
		});

		return [n, s];
	};

	this.remotes = {};
	this.apps = {};
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

	var loaded_apps = [];
	if (Array.isArray(config.app) && config.app.length) {
		var count = 0;
		config.app.forEach(function(struct) {
			_this.startup_struct(node, struct, _this.router.name,
					config.auto_install, function(a, level){
				loaded_apps.push(a);
				if (level == 1 && ++count == config.app.length){
					if (typeof callback === "function") {
						callback(loaded_apps);
					}
				}
			});
		});
	} else {
		if (typeof callback === "function") {
			callback([]);
		}
	}

	return loaded_apps;
};

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

main.prototype.module_get = function(app, callback) {
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

	var a = new Application(appname);
	if (typeof app === "string") {
		async_calls([
				this.require.bind(this, appname),
				this.load_schema.bind(this, appname)
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
							_this.load_schema,
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

main.prototype.startup = function(node, app, app_config, host_info, auto_install, callback) {
	var _this = this;

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
				node, app, app_config,
				host_info, auto_install,
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
			if (_this.emit("app_loading_error", e, node, app,
					app_config, host_info, auto_install,
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

main.prototype.startup_module = function(a, node, app, app_config, host_info, auto_install, callback) {
	var _this = this;

	var appname = a._get_app_name();
	var app_identifier = appname;
	var app_increment = 2;
	while(this.apps.hasOwnProperty(app_identifier)) {
		app_identifier = appname + " " + app_increment++;
	}
	a._id = app_identifier;

	if (typeof host_info === "undefined") {
		host_info = this;
	}
	if (typeof auto_install === "undefined") {
		auto_install = this._config.auto_install;
	}

	console.log("startup:", a._app);
	// bind to main:
	a._bind(this, host_info);

	if (typeof app_config !== "object") {
		// Warning: app_config is not an object
		app_config = {};
	}
	if (Object.keys(app_config).length == 0) {
		a._auto_configure(app_config);
	}

	if (typeof node !== "object" || node === null) {
		node = this.node("/app");
	}

	var node_source = node;
	if (typeof app_config.source === "string") {
		node_source = node.node(app_config.source);
	}

	var node_destination = null;
	var node_postname = "";
	if (typeof a.node_postname === "string") {
		node_postname = a.node_postname;
	}
	if (typeof app_config.node === "string") {
		node_destination = node_source.node(app_config.node + node_postname);
	} else if (typeof app_config.pnode === "string") {
		node_destination = node.node(app_config.pnode);
	} else if (typeof a.default_node_name === "string") {
		node_destination = node_source.node(a.default_node_name);
	} else {
		node_destination = node_source.node(a._id);
	}

	if (node_destination._app &&
			a._app === node_destination._app._app) {
		a = node_destination._app;
	} else {
		a._node = node_destination;
		this.app_register(a);
	}

	a._source = node_source;

	// init:
	try {
		if (!a._error) {
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
		if (typeof a._config === "undefined")
			a._config = app_config;
		a._set_state("ERROR_STARTING", e);
		a._error = e;

		// trigger global callback:
		this.emit("app_init_error", e, node, app, app_config,
					host_info, auto_install);
		// show error:
		console.error("error starting app:", e.stack || e);
	}

	// load child apps:
	if (Array.isArray(app_config.app)) {
		app_config.app.forEach(function(struct) {
			_this.startup_struct(node_destination, struct,
					host_info, auto_install,
					function(a, level) {
				if (typeof callback === "function") {
					callback(a, level+1);
				}
			});
		});
	}

	return a;
};

main.prototype.startup_struct = function(node, struct, host_info, auto_install, callback) {
	if (typeof struct !== "object") {
		if (typeof struct === "string") {
			struct = {"name": struct};
		} else {
			struct = {};
		}
	}
	if (typeof struct.config !== "object") {
		struct.config = {};
	}

	if (typeof struct.name === "string") {
		return this.startup(node, struct.name, struct.config, host_info, auto_install, callback);
	} else {
		console.warn("Warning: Application config options missing.", struct);
		return null;
	}
};

main.prototype.app_register = function(a) {
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

main.prototype.app_unregister = function(a) {
	delete this.apps[a._id];

	var node = a._node;
	if (typeof node._app == "object" &&
			node._app === a) {
		delete node._app;
	}
};

main.prototype.app_add_helper = function(config, app, settings) {
	if (!Array.isArray(config.app)) {
		config.app = [];
	}
	var struct = {
		"name": app,
		"config": settings
	}
	this.config_cleaning(struct);

	config.app.push(struct);
	return struct;
};

main.prototype.app_add = function(app, settings, node, config, callback) {
        // save to config:
	if (!config) {
		config = this._config;
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

main.prototype.app_remove = function(app) {
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
	this.config_cleaning();
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

