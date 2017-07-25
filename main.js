var Router = require("./router").router;
var Node = require("./router").node;
var Policy_checker = require("./module_policycheck.js").Policy_checker;
var Application = require("./application.js").application;

var require_vm = require("./helper_require_vm.js");

var merge = require("./helper_merge_data.js").merge;

var EventEmitter = require('events').EventEmitter;
var util = require('util');

function main(router_name) {
	EventEmitter.call(this);

	this._config = {};
	this._system_start = new Date();

	if (process.on) {
		process.on("unload", this.close.bind(this));
		process.title = "[er] "+(router_name || "energy-router");
	}

	this.router = new Router(router_name);

	var _this = this;
	Node.prototype.app = function(app, app_config) {
		return _this.startup(this, app, app_config);
	};
	Node.prototype.map = function(config, app, map_extra_elements) {
		var node = this;
		var map = {};
		if (!Array.isArray(config)) {
			throw new Error("map config is not defined.");
		}
		config.forEach(function(app_config) {
			var s = app_config.map;

			var vn = node.virtualnode();
			var a = vn.app(app, app_config);
			map[s] = { vn: vn, a: a };
		});
		var callback = function(s) {
			if (map.hasOwnProperty(s)) {
				return map[s].vn;
			}
			if (map_extra_elements) {
				var app_config = {};
				if (typeof map_extra_elements === "object") {
					app_config = map_extra_elemets;
				}
				app_config.node = s;
				if (typeof map_extra_elements === "function") {
					app_config = map_extra_elements(app_config);
				}
				app_config.map = s;
				config.push(app_config);
				if (config.__listener) {
					config.__listener();
				}

				var vn = node.virtualnode();
				var a = vn.app(app, app_config);
				map[s] = { vn: vn, a: a };
				return vn;
			}
			return null;
		};
		return {
			unload: function() {
				for(var s in map) {
					if (map.hasOwnProperty(s)) {
						map[s].vn.unannounce();
						map[s].a.unload();
						delete map[s];
					}
				}
			},
			node: callback
		};
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

main.prototype.config = function(config) {
	var _this = this;

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

	// TODO: Load console output
	//require('./router_console_out.js').init(this.router, "/console");

	if (typeof config.server !== "undefined" && config.server) {
		this.wss = this.create_websocket_server(config.server);
	}

	this.apps_use_vm = true;
	if (typeof config.apps_use_vm !== "undefined") {
		this.apps_use_vm = config.apps_use_vm;
	}

	if (typeof config.app_dir === "string") {
		config.app_dir = [ config.app_dir ];
	}
	if (typeof config.app_dir === "object" &&
			Array.isArray(config.app_dir)) {
		Array.prototype.push.apply(_this.app_dirs, config.app_dir);
	}

	this.sub_config(config);
};
main.prototype.sub_config = function(config) {
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
			_this.startup_struct(null, struct, _this.router.name, config.auto_install);
		});
	}
};


main.prototype.setup_history = function(save_history) {
	// Load history module
	var history_config = {
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
						"filename": "1d.vdb"
					}]
				},{
					"type": "file",
					"filename": "60min.vdb"
				}]
			},{
				"type": "file",
				"filename": "60sec.vdb"
			}]
		},{
			"type": "memory",
			"max_data": 3000
		},{
			"type": "file",
			"filename": "0.vdb"
		},{
			"type": "remote"
		}]
	};
	require('./module_history_class_memory.js');
	require('./module_history_class_remote.js');
	require('./module_history_class_timebase.js');
	if (save_history) {
		require('./module_history_class_file.js');
	}
	require('./module_history.js').init(this.router, history_config);
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

// TODO: Config:
main.prototype.create_console_output = function() {
	require('./router_console_out').init(this.router, "");
};

main.prototype.node = function(name) {
	return this.router.node(name);
};

main.prototype.app_dirs = [__dirname+"/", __dirname+"/../", "./", "../", ""];
main.prototype.require = function(app) {
	return require_vm(app, this.app_dirs, this.apps_use_vm);
};

main.prototype.startup = function(node, app, app_config, host_info, auto_install, callback) {
	var _this = this;

	if (typeof host_info === "undefined") {
		host_info = this;
	}
	if (typeof auto_install === "undefined") {
		auto_install = this._config.auto_install;
	}

	var appname = app;
	if (typeof app === "undefined" || app === null) {
		return;
	} else if (typeof app === "object") {
		appname = "unknown";
		if (typeof app._app === "string")
			appname = app._app;
	}
	appname = "er-app-" + appname.replace(/^er-app-/, "");
	console.info("startup:", appname);

	var app_identifier = appname;
	var app_increment = 2;
	while(this.apps.hasOwnProperty(app_identifier)) {
		app_identifier = appname + "_" + app_increment++;
	}

	var a = new Application(appname);
	try {
		if (typeof app_config !== "object") {
			app_config = {};
		}

		if (typeof app === "string") {
			a._bind_module( this.require(appname, app_config, host_info, auto_install) );
		} else if (typeof app === "object") {
			a._bind_module( app );
		} else {
			throw new Error("variable app has unknown type.");
		}
	} catch(e) {
		// save error:
		a._error = e;
		if (a._config)
			a._config = app_config;

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

	// bind:
	a._bind(app_identifier, this, host_info);

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
	} else if (typeof a.default_node_name === "string") {
		node_destination = node_source.node(a.default_node_name);
	} else {
		node_destination = node_source.node(app_identifier.
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

	if (appname !== "er-app-node" || !node._app) {
		node._app = a;
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

	if (typeof config !== "object") {
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


/* on signal: end the process */
if (process.on) { /* if NodeJS */
	process.on("preexit", function() {
		if (process.exitTimeoutId) return;

		process.exitTimeoutId = setTimeout(process.exit, 5000);
		process.exitTimeoutId.unref();
		console.log('process will exit in 5 seconds');

		process.on("exit", function(code) {
			console.log("Goodbye!");
		});

		process.emit("unload");
	});

	// if event loop is empty:
	process.once("beforeExit", function() {
		process.exitCode = 0;
		process.emit("preexit");
	});
	// if we got a signal to terminate:
	process.on('SIGTERM', function() {
		process.exitCode = 128+15;
		process.emit("preexit");
	});
	process.on('SIGINT', function() {
		process.exitCode = 128+2;
		process.emit("preexit");
	});

	// if an error occurred:
	process.on('uncaughtException', function(e) {
		process.exitCode = 1;
		console.error('Uncaught exception:', e.stack || e);
		// Do __not__ exit
		//process.emit("preexit");
	});
}

module.exports = main;

