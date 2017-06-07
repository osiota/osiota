var Router = require("./router").router;
var Policy_checker = require("./module_policycheck.js");
var Application = require("./application.js").application;

var require_vm = require("./helper_require_vm.js");

function main(router_name) {
	this.router = new Router(router_name);
	require('./router_io_function.js').init(this.router);
	require('./router_io_mean.js').init(this.router);
	require('./router_io_bias.js').init(this.router);
	require('./router_io_multiply.js').init(this.router);
	require('./router_io_sum.js').init(this.router);
	require('./router_io_accumulate.js').init(this.router);

	this.remotes = {};
	this.apps = {};
}

main.prototype.config = function(config) {
	var _this = this;

	this._config = config;

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
	if (typeof app === "object") {
		appname = app._app;
	}
	appname = "er-app-" + appname.replace(/^er-app-/, "");
	console.info("startup:", appname);

	var app_identifier = appname;
	var app_increment = 2;
	while(this.apps.hasOwnProperty(app_identifier)) {
		app_identifier = appname + "_" + app_increment++;
	}

	try {
		if (typeof node !== "object" || node === null) {
			node = this.node("/app");
		}

		var node_destination = null;
		if (typeof app_config !== "object") {
			app_config = {};
		}

		if (typeof app_config.node === "string") {
			node_destination = node.node(app_config.node);
		} else {
			node_destination = node.node(app_identifier.replace(/^er-app-/, ""));
		}
		var node_source = node;
		if (typeof app_config.source === "string") {
			node_source = node.node(app_config.source);
		}

		var a;
		if (typeof app === "string") {
			a = new Application(appname);
			a._bind_module( this.require(appname, app_config, host_info, auto_install) );
		} else if (typeof app === "object") {
			a = app;
		} else {
			throw new Error("variable app has unknown type.");
		}

		// bind:
		a._bind(app_identifier, this, host_info);
		this.apps[app_identifier] = a;

		a._source = node_source;
		a._node = node_destination;

		if (appname !== "er-app-node" || !node_destination.app)
			node_destination._app = a;

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
		console.error("error starting app:", e.stack || e);
		this.apps[app_identifier]._error = e;

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

var add_app_helper = function(config, app, settings) {
        if (!Array.isArray(config.app)) {
                config.app = [];
        }
        var struct = {
                "name": app,
                "config": settings
        }
        config.app.push(struct);
        return struct;
};

main.prototype.app_add = function(app, settings, node, config, callback) {
        // save to config:
	if (!config) {
		config = this._config;
	}
	if (typeof settings !== "object")
		settings = {};
	if (node) {
		if (typeof node._app === "object"
				&& node._app._state === "RUNNING") {
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
			var struct_n = add_app_helper(config, "node", {
				"node": node.name
			});
			this.startup_struct(node, struct_n);
			config = struct_n.config;
		}
	}

        var struct = add_app_helper(config, app, settings);
	this.startup_struct(node, struct, undefined, undefined, callback);
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

	process.on('uncaughtException', function(e) {
		console.error('Uncaught exception:', e.stack || e);
	});
}

module.exports = main;

