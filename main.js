var Router = require("./router").router;
var Node = require("./router").node;
var Policy_checker = require("./module_policycheck.js");
var Application = require("./application.js").application;

var require_vm = require("./helper_require_vm.js");

var EventEmitter = require('events').EventEmitter;
var util = require('util');

function main(router_name) {
	EventEmitter.call(this);

	this.router = new Router(router_name);
	require('./router_io_function.js').init(this.router);
	require('./router_io_mean.js').init(this.router);
	require('./router_io_bias.js').init(this.router);
	require('./router_io_multiply.js').init(this.router);
	require('./router_io_sum.js').init(this.router);
	require('./router_io_accumulate.js').init(this.router);

	var _this = this;
	Node.prototype.app = function(app, app_config) {
		return _this.startup(this, app, app_config);
	};
	Node.prototype.map = function(config, app, map_extra_elements) {
		var node = this;
		var map = {};
		if (!Array.isArray(config)) {
			return;
		}
		config.forEach(function(app_config) {
			var s = app_config.map;

			var vn = node.virtualnode();
			var a = vn.app(app, app_config);
			map[s] = { vn: vn, a: a };
		});
		var callback = function(s) {
			if (this.map.hasOwnProperty(s)) {
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
	this.router.policy_checker = new Policy_checker.Policy_checker(this.router);
	if (typeof config.policies !== 'undefined'){
		var policies = config.policies;
		for (var i = 0; i < policies.length; i++) {
			this.router.policy_checker.add_policy("user_level",policies[i]);
		}
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
			if (typeof c.name === "string" &&
					typeof c.url === "string") {
				_this.remotes[c.name] =
					_this.create_websocket_client(c.url, c.node, c);
			} else {
				console.warn("Waring: Remote config options missing.", c);
			}
			if (c.secure === "true"){
				_this.router.policy_checker.add_observed_connection(c.url);
			}
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
	var wss = require('./router_websockets').init(this.router, "", server_port);
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
			ws.node_local(node, "subscribe_announcement");
		});
	} else if (typeof nodes === "string") {
		ws.node_local(nodes, "subscribe_announcement");
	} else {
		ws.node_local("/", "subscribe_announcement");
	}

	// data from UPSTREAM
	if (typeof config.subscribe === "string") {
		ws.subscribe_announcement(config.subscribe);
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

	var a = null;
	try {
		if (typeof app_config !== "object") {
			app_config = {};
		}

		if (typeof app === "string") {
			a = new Application(appname);
			a._bind_module( this.require(appname, app_config, host_info, auto_install) );
		} else if (typeof app === "object") {
			if (app.hasOwnProperty("_state") &&
					app._state === "INIT") {
				a = app;
			} else {
				a = new Application(appname);
				a._bind_module( app );
			}
		} else {
			throw new Error("variable app has unknown type.");
		}

		// bind:
		a._bind(app_identifier, this, host_info);

		if (typeof node !== "object" || node === null) {
			node = this.node("/app");
		}

		var node_destination = null;
		if (typeof app_config.node === "string") {
			node_destination = node.node(app_config.node);
		} else if (typeof a.default_node_name === "string") {
			node_destination = node.node(a.default_node_name);
		} else {
			node_destination = node.node(app_identifier.
				replace(/^er-app-/, "").replace(/\//g, "-"));
		}
		var node_source = node;
		if (typeof app_config.source === "string") {
			node_source = node.node(app_config.source);
		}

		a._source = node_source;
		a._node = node_destination;

		this.app_register(a);

		// init:
		a._init(app_config);

		if (typeof callback === "function") {
			callback(a);
		}

		if (Array.isArray(app_config.app)) {
			app_config.app.forEach(function(struct) {
				_this.startup_struct(node_destination, struct);
			});
		}

		return a;
	} catch(e) {
		// save error:
		if (a === null) {
			a = {};
		}
		if (!this.apps[app_identifier]) {
			this.apps[app_identifier] = a;
		}
		this.apps[app_identifier]._error = e;

		// trigger global callback:
		if (this.emit("app_loading_error", e, node, app, app_config,
					host_info, auto_install, function(an) {
			if (typeof an === "object") {
				a = an;
				if (typeof callback === "function") {
					callback(a);
				}
			}
		})) {
			return a;
		}

		// show error:
		console.error("error starting app:", e.stack || e);

		return null;
	}
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

main.prototype.close = function() {
	for (var a in this.apps) {
		this.apps[a]._unload();
	}

	for (var r in this.remotes) {
		console.log("closing remote", r);
		this.remotes[r].close();
	}

	if (this.wss) {
		console.log("closing websocket server");
		this.wss.close();
		this.wss = undefined;
	}
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
	process.on('SIGINT', function() { process.exit(0); });
	process.on('SIGTERM', function() { process.exit(0); });
	//process.on('exit');

	process.on('uncaughtException', function(e) {
		console.error('Uncaught exception:', e.stack || e);
	});
}

module.exports = main;

