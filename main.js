var Router = require("./router").router;

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

	if (typeof config.hostname !== "undefined") {
		this.router.name = config.hostname;
	}

	// TODO: Load history module
	require('./module_history.js').init(this.router, 'ram');
	// TODO: Load console output
	//require('./router_console_out.js').init(this.router, "/console");

	if (typeof config.server !== "undefined" && config.server) {
		this.create_websocket_server(config.server);
	}
	if (typeof config.connect === "object") {
		this.router.connectArray(config.connect);
	}

	if (Array.isArray(config.remote)) {
		config.remote.forEach(function(c) {
			if (typeof c.name === "string" &&
					typeof c.url === "string") {
				_this.remotes[c.name] =
					_this.create_websocket_client(c.url, c.node);
			} else {
				console.log("Waring: Remote config options missing.", c);
			}
		});
	}

	if (typeof config.require_method === "string") {
		if (!this.hasOwnProperty("require_" + config.require_method))
			throw new Error("require method not found.");
		this.require = this["require_" + config.require_method];
	}

	if (Array.isArray(config.app)) {

		config.app.forEach(function(app) {
			if (typeof app.name === "string") {
				//_this.apps[app.name] =
				_this.startup(app.name, app.config, _this.router.name, config.auto_install);
			} else {
				console.log("Waring: Application config options missing.", app);
			}
		});
	}
};

main.prototype.create_websocket_server = function(server_port) {
	require('./router_websockets').init(this.router, "", server_port);
};

main.prototype.create_websocket_client = function(url, nodes) {
	var ws = require('./router_websocket_client').init(this.router, "", url);
	if (Array.isArray(nodes)) {
		nodes.forEach(function(node) {
			ws.node_local(node, "subscribe_announcement");
		});
	} else if (typeof nodes === "string") {
		ws.node_local(nodes, "subscribe_announcement");
	} else {
		// data to UPSTREAM
		ws.node_local("/", "subscribe_announcement");
		// add "/" + this.router.name
		ws.remote_basename = "/" + this.router.name;

		// data from UPSTREAM
		//ws.subscribe_announcement("/");
		// add ":" + remote.name ???
	}
};

// TODO: Config:
main.prototype.create_console_output = function() {
	require('./router_console_out').init(this.router, "");
};

main.prototype.node = function(name) {
	return this.router.node(name);
};

main.prototype.try_require = function(require_fkt, app, app_config, host_info, auto_install) {
	try {
		return require_fkt.call(this, app, app_config, host_info, auto_install);
	} catch(error) {
		if (error.code == 'MODULE_NOT_FOUND') {
			return false;
		}
		throw error;
	}
};

main.prototype.require_router_module = function(app) {
	if (app.match(/^router_/)) {
		app = app.replace(/^router_/, "");
		return require("./router_" + app);
	}
	return false;
};

main.prototype.require_indir = function(app) {
	app = app.replace(/^er-app-/, "");
	return require("./er-app-" + app);
};
main.prototype.require_inpdir = function(app) {
	app = app.replace(/^er-app-/, "");
	return require("../er-app-" + app);
};
main.prototype.require_module = function(app) {
	app = app.replace(/^er-app-/, "");
	return require("er-app-" + app);
};
main.prototype.require_auto = function(app, app_config, host_info, auto_install) {
	var m;
	m = this.try_require(this.require_router_module, app, app_config, host_info, auto_install);
	if (m) return m;

	m = this.try_require(this.require_indir, app, app_config, host_info, auto_install);
	if (m) return m;
	
	m = this.try_require(this.require_inpdir, app, app_config, host_info, auto_install);
	if (m) return m;

	m = this.try_require(this.require_module, app, app_config, host_info, auto_install);
	if (m) return m;

	throw new Error("Application not found: " + app);
};

main.prototype.require = main.prototype.require_auto;

main.prototype.startup = function(app, app_config, host_info, auto_install) {
	console.log("startup:", app);

	try {
		var m = this.require(app, app_config, host_info, auto_install);

		// TODO: Change Arguments:
		var n = this.node("/app/"+app);
		this.apps[app] = m;
		m.init(n, app_config, this, host_info, auto_install);
	} catch(error) {
		console.log("error starting app: ", error);
	}
	return app;
};

module.exports = main;

