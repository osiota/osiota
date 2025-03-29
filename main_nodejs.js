const main = require("./main.js");

const ApplicationManager = require("./application_manager.js").application_manager;


const require_vm = require("./helper_require_vm.js");

const schema_cache = {};

class main_nodejs extends main {
	constructor(router_name) {
		super(router_name);

		this.application_manager = new ApplicationManager(this);

		if (process.on) {
			process.on("unload", this.close.bind(this));
			process.title = "[osiota] "+(router_name || "osiota");
		}
	};

	os_config(config) {
		const _this = this;

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

	/* istanbul ignore next manually tested */
	check_started(factor, counter) {
		if (typeof counter === "undefined")
			counter = 100;
		if (typeof factor === "undefined")
			factor = 8;
		else if (factor < 1) factor = 1;
		else if (factor > 32) factor = 32;
		if (counter <= 0) {
			return this.started();
		}

		const _this = this;
		//const t_1 = new Date()*1;
		const t = process.hrtime();
		//setTimeout(function() {
		setImmediate(function() {
			//const t_2 = new Date()*1;
			const diff = process.hrtime(t);
			let delta = diff[0] * 1e9 + diff[1];

			if (_this._close) return;
			console.debug("delta", delta, "factor", factor);
			if (process.env.OSIOTA_TEST == "1") {
				delta = 0;
				factor = 1;
			}
			let tid = null;
			if (delta >= 4e6) {
				if (factor < 8) factor = 8;
				tid = setTimeout(_this.check_started.bind(_this,
					factor*2), 100*factor, counter-1);
			}
			else if (delta >= 1e6) {
				tid = setTimeout(_this.check_started.bind(_this,
					factor), 100*factor, counter-1);
			} else {
				if (factor == 1) {
					_this.started();
				} else {
					tid = setTimeout(_this.check_started.bind(_this,
						factor/2), 100*factor, counter-1);
				}
			}
			if (tid && _this.listenerCount("started") == 0) {
				tid.unref();
			}
		}, 0);
	};

	app_dirs = [__dirname+"/", __dirname+"/../", "./", "../", ""];
	add_app_dir(app_dir) {
		this.app_dirs.push(app_dir);
	};
	require(appname, callback) {
		return new Promise((resolve, reject)=>{
			this.require_options([
				"osiota-app-" + appname,
				"er-app-" + appname
			],
			(err, app)=>{
				if (callback) callback(err, app);
				if (err) return reject(err);
				resolve(app);
			});
		});
	};
	require_options(options, callback) {
		try {
			const contents = require_vm(options, this.app_dirs,
				this.apps_use_vm);
			callback(null, contents);
		} catch (err) {
			callback(err);
		}
	};
	load_schema(appname, callback) {
		return new Promise((resolve, reject)=>{
			this.load_schema_cb(appname, (err, schema)=>{
				if (callback) callback(err, schema);
				if (err) return reject(err);
				resolve(schema);
			});
		});
	};
	load_schema_cb(appname, callback) {
		const _this = this;
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
					const schema = {
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
	shutdown() {
		this.close();
		process.exitTimeoutId = setTimeout(process.exit, 5000);
		process.exitTimeoutId.unref();
		console.log('osiota: will exit in 5 seconds');

		process.on("exit", function(code) {
			console.log("Goodbye!");
		});
	};
	restart() {
		this.shutdown();
	};
};
module.exports = main_nodejs;


/* on signal: end the process */
/* istanbul ignore next tested in test/61 */
if (process.on) { /* if NodeJS */
	process.on("preexit", function(user_terminated) {
		if (process.exitTimeoutId) return;

		process.user_terminated = user_terminated;

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
			console.error('unhandledRejection', e.stack || e);
		});
	}


	let why_is_node_running = null;
	try {
		if (process.env.OSIOTA_DEBUG == 1)
			why_is_node_running = require("why-is-node-running");
	} catch(err) {}

}

