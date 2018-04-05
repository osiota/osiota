var Router = require("./router").router;
var Node = require("./router").node;
var Policy_checker = require("./module_policycheck.js").Policy_checker;
var Application = require("./application.js").application;
var ApplicationManager =require("./application_manager.js").application_manager;

var merge = require("./helper_merge_data.js").merge;
var helper = require("./helper.js");

var EventEmitter = require('events').EventEmitter;
var util = require('util');

require('./module_history_class_memory.js');
require('./module_history_class_remote.js');
require('./module_history_class_timebase.js');
require('./module_history_class_filter.js');

function main(router_name) {
	EventEmitter.call(this);

	this._config = {};
	this._system_start = new Date();

	this.helper = helper;

	this.router = new Router(router_name);

	this.application_manager = new ApplicationManager(this);

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
		var map = {};
		if (!Array.isArray(config)) {
			if (config && typeof config.map === "object" &&
					config.map !== null) {
				config = config.map;
			} else {
				throw new Error("map config is not defined.");
			}
		}
		var map_name = function(app_config) {
			var key = "";
			if (typeof map_key === "function") {
				key = map_key(app_config);
			} else {
				key = app_config.map;
			}
			return key;
		};
		var map_element = function(key, app_config, local_metadata){
			var local_app = app;
			if (typeof app_config.self_app !== "undefined"){
				local_app = app_config.self_app;
			}
			if (local_app === false)
				return null;

			var n;
			if (local_app === null) {
				n = node.node(app_config.node);
			} else {
				n = node.virtualnode();
			}

			var metadata = {};
			if (typeof local_metadata === "object" &&
					local_metadata !== null) {
				metadata = local_metadata;
			}
			if (typeof app_config.metadata === "object" &&
					app_config.metadata !== null) {
				metadata = app_config.metadata;
			}
			if (typeof map_initialise === "function") {
				map_initialise(n, metadata, app_config);
			} else {
				n.announce(metadata);
			}

			var a;
			if (local_app !== null) {
				a = n.app(local_app, app_config);
			}

			map[key] = {
				vn: n,
				a: a,
				config: app_config
			};
			return n;
		};
		config.forEach(function(app_config) {
			var key = map_name(app_config);
			if (typeof app_config.node !== "string") {
				app_config.node = key.replace(/^\//, "");
			}
			return map_element(key, app_config, null, true);
		});
		var callback = function(app_config, local_metadata, cache) {
			if (typeof app_config === "string") {
				app_config = {
					"map": app_config
				};
			}
			var key = map_name(app_config, cache);
			if (map.hasOwnProperty(key)) {
				if (typeof map[key].vn !== "undefined") {
					var vn = map[key].vn;
					return vn;
				}
				if (typeof map[key].config !== "undefined") {
					app_config = map[key].config;
				}
			}

			if (!map_extra_elements) {
				return null;
			}
			if (typeof map_extra_elements === "object"
					&& map_extra_elements !== null) {
				for (var m in map_extra_elements) {
					app_config[m] = map_extra_elements[m];
				}
			}
			if (typeof map_extra_elements === "function") {
				map_extra_elements(app_config, local_metadata);
			}
			if (typeof app_config.node !== "string") {
				app_config.node = key.replace(/^\//, "");
			}

			config.push(app_config);
			if (config.__listener) {
				config.__listener();
			}

			return map_element(key, app_config, local_metadata,
					false, cache);
		};
		return {
			unload: function() {
				for(var s in map) {
					if (map.hasOwnProperty(s)) {
						map[s].vn.unannounce();
						if (map[s].a)
							map[s].a.unload();
						delete map[s];
					}
				}
			},
			remove_node: function(app_config) {
				if (typeof app_config === "string") {
					app_config = {
						"map": app_config
					};
				}
				var key = map_name(app_config);
				if (map.hasOwnProperty(key)) {
					map[key].vn.unannounce();
					delete map[key].vn;
					if (map[key].a) {
						map[key].a.unload();
						delete map[key].a;
					}
				}
			},
			node: callback
		};
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
	"Application": Application
};

main.prototype.preparation_config = function(config) {
	var _this = this;

	// preparation:
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

main.prototype.config = function(config) {
	var _this = this;
	this.preparation_config(config);
	if (typeof this.os_config === "function") {
		this.os_config(config);
	}
	this.sub_config(config);

	setTimeout(function() {
		_this.check_started();
	}, 500);
};
main.prototype.sub_config = function(config, node) {
	var _this = this;

	if (typeof config.connect === "object") {
		this.router.connectArray(config.connect);
	}

	if (Array.isArray(config.remote)) {
		config.remote.forEach(function(c) {
			if (typeof c.name !== "string" ||
					typeof c.url !== "string") {
				console.warn("Waring: Remote config options missing.", c);
				return;
			}
			_this.remotes[c.name] =
				_this.create_websocket_client(c.url, c.node, c);
		});
	}

	if (Array.isArray(config.app)) {
		config.app.forEach(function(struct) {
			_this.startup_struct(node, struct, _this.router.name, config.auto_install);
		});
	}
};

main.prototype.check_started = function(factor) {
	if (typeof factor === "undefined")
		factor = 8;
	else if (factor < 1) factor = 1;
	else if (factor > 32) factor = 32;

	var _this = this;
	//var t_1 = new Date()*1;
	var t = process.hrtime();
	//setTimeout(function() {
	setImmediate(function() {
		//var t_2 = new Date()*1;
		var diff = process.hrtime(t);
		var delta = diff[0] * 1e9 + diff[1];

		console.log("delta", delta, "factor", factor);
		var tid = null;
		if (delta >= 4e6) {
			if (factor < 8) factor = 8;
			tid = setTimeout(_this.check_started.bind(_this,
				factor*2), 100*factor);
		}
		else if (delta >= 1e6) {
			tid = setTimeout(_this.check_started.bind(_this,
				factor), 100*factor);
		} else {
			if (factor == 1) {
				console.log("started");
				_this.emit("started");
			} else {
				tid = setTimeout(_this.check_started.bind(_this,
					factor/2), 100*factor);
			}
		}
		if (tid && _this.listenerCount("started") == 0) {
			tid.unref();
		}
	}, 0);
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

main.prototype.create_websocket_server = function(server_port) {
	var wss = require('./router_websocket_server').init(this.router, "", server_port);
	//this.router.policy_checker.add_observed_connection(wss.wpath);
	return wss;
};

main.prototype.create_websocket_client = function(url, nodes, config) {
	var ws = require('./router_websocket_client').init(this.router, "", url);
	if (typeof config.remote_basename === "string") {
		ws.remote_basename = config.remote_basename;
	} else {
		ws.remote_basename = "/" + this.router.name;
	}
	if (typeof config.basename === "string") {
		ws.basename = config.basename;
	}

	// data to UPSTREAM
	if (Array.isArray(nodes)) {
		nodes.forEach(function(node) {
			ws.node_plocal(node, "subscribe_announcement");
		});
	} else if (typeof nodes === "string") {
		ws.node_plocal(nodes, "subscribe_announcement");
	} else {
		ws.node_plocal("/", "subscribe_announcement");
	}

	// data from UPSTREAM
	if (typeof config.subscribe === "string") {
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

main.prototype.require = function(app, callback) {
	throw new Error("Require function not supported.");
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
	appname = "er-app-" + appname.replace(/^er-app-/, "");
	console.info("loading:", appname);

	var app_identifier = appname;
	var app_increment = 2;
	while(this.apps.hasOwnProperty(app_identifier)) {
		app_identifier = appname + "_" + app_increment++;
	}

	var a = new Application(appname);
	a._id = app_identifier;
	if (typeof app === "string") {
		this.require(appname, function(struct) {
			// bind module:
			a._bind_module(
				struct,
				_this.module_get.bind(_this),
				function() {
					callback(a);
				}
			);
		});
	} else if (typeof app === "object" && app !== null) {
		a._bind_module(
			app,
			_this.module_get.bind(_this),
			function() {
				callback(a);
			}
		);
	} else {
		throw new Error("variable app has unknown type.");
	}
};

main.prototype.startup = function(node, app, app_config, host_info, auto_install, callback) {
	var _this = this;

	try {
		if (typeof app_config !== "object") {
			app_config = {};
		}

		this.module_get(app, function(a) {
			return _this.startup_module( a,
					node, app, app_config,
					host_info, auto_install,
					callback);
		});
	} catch(e) {
		// trigger global callback:
		if (this.emit("app_loading_error", e, node, app, app_config,
					host_info, auto_install, function(an) {
			if (typeof an === "object") {
				if (typeof callback === "function") {
					callback(an);
				}
			}
		})) {
			// assume that an other app as been loaded.
			return null;
		}

		// show error:
		console.error("error starting app:", e.stack || e);

	}

};
main.prototype.startup_module = function(a, node, app, app_config, host_info, auto_install, callback) {
	var _this = this;

	if (typeof host_info === "undefined") {
		host_info = this;
	}
	if (typeof auto_install === "undefined") {
		auto_install = this._config.auto_install;
	}

	console.info("startup:", a._app);
	// bind to main:
	a._bind(this, host_info);

	if (typeof node !== "object" || node === null) {
		node = this.node("/app");
	}

	var node_source = node;
	if (typeof app_config.source === "string") {
		node_source = node.node(app_config.source);
	}

	var node_destination = null;
	if (typeof app_config.node === "string") {
		node_destination = node_source.node(app_config.node);
	} else if (typeof app_config.pnode === "string") {
		node_destination = node.node(app_config.pnode);
	} else if (typeof a.default_node_name === "string") {
		node_destination = node_source.node(a.default_node_name);
	} else {
		node_destination = node_source.node(a._id.
			replace(/^er-app-/, "").replace(/\//g, "-"));
	}

	a._source = node_source;
	a._node = node_destination;

	// init:
	try {
		if (!a._error) {
			a._init(app_config);

			if (typeof callback === "function") {
				callback(a);
			}
		}
	} catch(e) {
		// save error:
		a._error = e;
		if (a._config)
			a._config = app_config;

		// trigger global callback:
		this.emit("app_init_error", e, node, app, app_config,
					host_info, auto_install);
		// show error:
		console.error("error starting app:", e.stack || e);
	}

	this.app_register(a);

	// load child apps:
	if (Array.isArray(app_config.app)) {
		app_config.app.forEach(function(struct) {
			_this.startup_struct(node_destination, struct);
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
		console.warn("Waring: Application config options missing.", struct);
		return null;
	}
};

main.prototype.app_register = function(a) {
	this.apps[a._id] = a;

	var appname = a._app;
	var node = a._node;

	if (appname === "er-app-node") {
		if (!node._app) {
			node._app = a;
		}
		// else do nothing
	} else {
		if (node._app) {
			if (node._app._app === "er-app-node") {
				node._app = a;
			} else {
				console.warn("There is already an app bind " +
					"to that node:", node.name,
					"(", a._app, "vs", node._app._app, ")");
			}
		} else {
			node._app = a;
		}
	}

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
	app._unload();

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

main.prototype.close = function() {
	var _this = this;
	if (this._close) return;
	this._close = true;
	console.log("closing energy-router");

	setImmediate(function() {
		for (var a in _this.apps) {
			console.log("unloading app", a);
			if (_this.apps[a]._unload)
				_this.apps[a]._unload();
		}

		for (var r in _this.remotes) {
			console.log("closing remote", r);
			_this.remotes[r].close();
			delete _this.remotes[r];
		}

		if (_this.wss) {
			console.log("closing websocket server");
			_this.wss.close();
			_this.wss = undefined;
		}
	});
};

main.prototype.reload = function(callback) {
	var config = this._config;
	this.close();

	console.warn("\n\nRELOADING ...");
	var s = setTimeout(function() {
		var m = new main();
		m.config(config);
		if (typeof callback === "function")
			callback(m);
	}, 1000);
};

module.exports = main;

