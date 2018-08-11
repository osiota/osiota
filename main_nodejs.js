var main = require("./main.js");
var util = require('util');

var require_vm = require("./helper_require_vm.js");

function main_nodejs(router_name) {
	main.call(this);

	if (process.on) {
		process.on("unload", this.close.bind(this));
		process.title = "[er] "+(router_name || "energy-router");
	}
};
util.inherits(main_nodejs, main);

main_nodejs.prototype.os_config = function(config) {
	var _this = this;

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
};

main_nodejs.prototype.create_websocket_server = function(server_port) {
	var wss = require('./router_websocket_server').init(this.router, "", server_port);
	//this.router.policy_checker.add_observed_connection(wss.wpath);
	return wss;
};

main_nodejs.prototype.app_dirs = [__dirname+"/", __dirname+"/../", "./",
	"../", ""];
main_nodejs.prototype.require = function(appname, callback) {
	callback(require_vm(appname, this.app_dirs, this.apps_use_vm));
};

/* on signal: end the process */
if (process.on) { /* if NodeJS */
	process.on("preexit", function(user_terminated) {
		if (process.exitTimeoutId) return;

		main.user_terminated = user_terminated;

		process.exitTimeoutId = setTimeout(process.exit, 5000);
		process.exitTimeoutId.unref();
		console.log('process will exit in 5 seconds');

		process.on("exit", function(code) {
			console.log("Goodbye!");
			if (why_is_node_running)
				why_is_node_running();
		});

		process.emit("unload");
	});

	// if event loop is empty:
	process.once("beforeExit", function() {
		process.exitCode = 0;
		process.emit("preexit", false);
	});
	// if we got a signal to terminate:
	process.on('SIGTERM', function() {
		process.exitCode = 128+15;
		process.emit("preexit", true);
	});
	process.on('SIGINT', function() {
		process.exitCode = 128+2;
		process.emit("preexit", true);
	});

	// if an error occurred:
	process.on('uncaughtException', function(e) {
		process.exitCode = 1;
		console.error('Uncaught exception:', e.stack || e);
		// Do __not__ exit
		//process.emit("preexit");
	});
	process.on('unhandledRejection', function(e) {
		console.log('unhandledRejection', e.stack || e);
	});


	var why_is_node_running = null;
	try {
		if (process.env.ER_DEBUG == 1)
			why_is_node_running = require("why-is-node-running");
	} catch(err) {}

}

module.exports = main_nodejs;

