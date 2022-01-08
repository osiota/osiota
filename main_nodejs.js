var main = require("./main.js");
var util = require('util');

var ApplicationManager =require("./application_manager.js").application_manager;


var require_vm = require("./helper_require_vm.js");

function main_nodejs(router_name) {
	main.apply(this, arguments);

	this.application_manager = new ApplicationManager(this);

	if (process.on) {
		process.on("unload", this.close.bind(this));
		process.title = "[osiota] "+(router_name || "osiota");
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

main_nodejs.prototype.check_started = function(factor) {
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

		if (_this._close) return;
		console.debug("delta", delta, "factor", factor);
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
				_this._started = true;
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

main_nodejs.prototype.create_websocket_server = function(server_port) {
	var wss = require('./router_websocket_server').init(this.router, "", server_port);
	//this.router.policy_checker.add_observed_connection(wss.wpath);
	return wss;
};

main_nodejs.prototype.app_dirs = [__dirname+"/", __dirname+"/../", "./",
	"../", ""];
main_nodejs.prototype.add_app_dir = function(app_dir) {
	this.app_dirs.push(app_dir);
};
main_nodejs.prototype.require = function(appname, callback) {
	this.require_options([
		"osiota-app-" + appname,
		"er-app-" + appname
	], callback);
};
main_nodejs.prototype.require_options = function(options, callback) {
	try {
		var contents = require_vm(options, this.app_dirs,
			this.apps_use_vm);
		callback(null, contents);
	} catch (err) {
		callback(err);
	}
};
var schema_cache = {};
main_nodejs.prototype.load_schema = function(appname, callback) {
	var _this = this;
	if (typeof appname !== "string")
		throw new Error("admin-app: app needs to be string");
	appname = appname.replace(/^(er|osiota)-app-/, "");

	if (schema_cache.hasOwnProperty(appname)) {
		return callback(null, schema_cache[appname]);
	}
	this.require_options([
		"osiota-app-" + appname + "-schema.json",
		"er-app-" + appname + "-schema.json",
		"osiota-app-" + appname + "/schema.json",
		"er-app-" + appname + "/schema.json",
		"osiota-app-" + appname + "/schema-config.json",
		"er-app-" + appname + "/schema-config.json"
	], function(err, contents) {
		if (err) {
			if (err.code === "OSIOTA_APP_NOT_FOUND") {
				// default schema:
				var schema = {
					"type": "object",
					"title": "Settings",
					"additionalProperties": true
				};
				schema_cache[appname] = schema;
				return callback(null, schema);
			}
			return callback(err);
		}
		schema_cache[appname] = contents;
		return callback(null, contents);
	});

};

/* on signal: end the process */
if (process.on) { /* if NodeJS */
	process.on("preexit", function(user_terminated) {
		if (process.exitTimeoutId) return;

		main.user_terminated = user_terminated;

		process.exitTimeoutId = setTimeout(process.exit, 5000);
		process.exitTimeoutId.unref();
		console.log('osiota: will exit in 5 seconds');

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
	process.once('SIGTERM', function() {
		process.exitCode = 128+15;
		process.emit("preexit", true);
	});
	process.once('SIGINT', function() {
		process.exitCode = 128+2;
		process.emit("preexit", true);
	});

	if (process.env.OSIOTA_TEST != 1) {
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
	}


	var why_is_node_running = null;
	try {
		if (process.env.OSIOTA_DEBUG == 1)
			why_is_node_running = require("why-is-node-running");
	} catch(err) {}

}

module.exports = main_nodejs;

