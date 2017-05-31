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

	// Load history module
	require('./module_history.js').init(this.router, 'ram');

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
		this.create_websocket_server(config.server);
	}

	this.apps_use_vm = true;
	if (typeof config.apps_use_vm !== "undefined") {
		this.apps_use_vm = config.apps_use_vm;
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

main.prototype.require = function(app) {
	return require_vm(app, ["./", "../", ""], this.apps_use_vm);
};

main.prototype.startup = function(node, app, app_config, host_info, auto_install, callback) {
	app = "er-app-" + app.replace(/^er-app-/, "");
	console.info("startup:", app);

	var app_identifier = app;
	var app_increment = 2;
	while(this.apps.hasOwnProperty(app_identifier)) {
		app_identifier = app + "_" + app_increment++;
	}

	try {
		if (typeof node !== "object" || node === null) {
			node = this.node("/app/" + app_identifier);
		}
		var a = new Application(app_identifier, app, node, app_config, this, host_info);
		this.apps[app_identifier] = a;

		a._bind_module( this.require(app, app_config, host_info, auto_install) );
		a._init();

		if (typeof callback === "function") {
			callback(a);
		}
	} catch(e) {
		console.error("error starting app:", e.stack || e);
		this.apps[app_identifier]._error = e;
	}
	return app;
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
	if (typeof struct.config.node === "string") {
		node = this.node(struct.config.node);
	}
	if (typeof struct.name === "string") {
		this.startup(node, struct.name, struct.config, host_info, auto_install, callback);
	} else {
		console.warn("Waring: Application config options missing.", struct);
	}
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

