#!/usr/bin/env node

const path = require('path');
const daemon = require('./helper_daemon.js');
const helper_config_file = require('./helper_config_file.js');
const argv = require('minimist')(process.argv.slice(2));

// Flags:
argv.help    = argv.help    || argv.h;
argv.daemon  = argv.daemon  || argv.d;
argv.restart = argv.restart;
argv.reload  = argv.reload  || argv.r;
argv.stop    = argv.stop    || argv.k;
argv.status  = argv.status  || argv.s;
argv.version = argv.version || argv.V;
argv.verbose = argv.verbose || argv.v;

if (process.env.__daemon) {
	if (typeof argv.verbose === "undefined") {
		argv.verbose = true;
	}
	argv.daemon = false;
	argv.restart = false;
}

let config_file = argv.config || "osiota.json";
const log_file = config_file.replace(/\.json$/i, "") + ".log";
const pid_file = config_file.replace(/\.json$/i, "") + ".pid";
if (argv.app) config_file = null;


if (argv.help && !argv.app) {
	console.info('Usage: osiota [args]\n');
	console.group();
	console.info('Options:\n' +
		'  --config [file]  Path to the config file\n' +
		'                 (default: "osiota.json")\n' +
		'  --check        Check the config file\n' +
		'  --status, -s   Get status of the daemon\n' +
		'  --daemon, -d   Daemonize the process\n' +
		'  --restart      Restart process\n' +
		'  --reload, -r   Reload the configuration of a daemon\n' +
		'  --stop, -k     Stop a process\n' +
		'\n' +
		'  --help, -h     Show help text\n' +
		'  --version, -V  Show version\n' +
		'  --verbose, -v  Show more or less messages\n' +
		'\n' +
		'  --app [app]    Run an app\n' +
		'  --app [app] --help  Show help text for app\n' +
		'\n' +
		'Example:\n' +
		'  osiota --config myconfig.json --daemon\n');
	console.groupEnd();

} else if (argv.version) {
	console.info(require("./package.json").version);

} else if (argv.stop) {
	const pid = daemon.process_status(pid_file);
	if (!pid) {
		return console.error("Error: no running process found");
	}
	module.exports.loaded =
	daemon.process_stop(pid, async function() {
		return daemon.pidfile_delete(pid_file);
	});

} else /* istanbul ignore if tested in test/61 */ if (argv.restart) {
	const pid = daemon.process_status(pid_file);
	if (!pid) {
		console.warn("Warning: no running process found");
		daemon.daemon_start(log_file);
		return;
	}
	module.exports.loaded =
	daemon.process_stop(pid, async function() {
		await daemon.pidfile_delete(pid_file);
		return daemon.daemon_start(log_file);
	});

} else /* istanbul ignore if manually tested in test/61 */ if (argv.reload) {
	const pid = daemon.process_status(pid_file);
	if (!pid) {
		return console.error("Error: no running process found");
	}
	process.kill(pid, 'SIGUSR2');

} else if (argv.status) {
	return console.info("Status:",
		daemon.process_status(pid_file) ? "running" : "stopped");

} else if (argv.daemon && !process.env.__daemon) {
	if (daemon.process_status(pid_file)) {
		return console.error(
			"Error: An other process is still running.");
	}
	daemon.daemon_start(log_file);

} else { // start
	// optional better console output:
	if (!argv.help && !argv.app && !argv.systemd) {
		try {
			require('console-stamp')(console, {
				format: ':date(yyyy-mm-dd HH:MM:ss) :label(7)',
				extend: {
					debug: 5,
				},
				include: ['debug', 'log', 'info', 'warn', 'error'],
				level: 'debug',
			});
		} catch(err) {}
	}

	if (!argv.verbose && !argv.systemd) {
		// error
		// warn
		// info
		console.log = function() {};
		console.debug = function() {};
	}

	let config = helper_config_file.read(argv.config);
	const config_filename = (typeof argv.config === "string" ?
		argv.config.replace(/^.*\/|\.json$|[-_]?(osiota|config)[-_]?/g, "") : "");

	const os = require('os');
	const main = require('./main_nodejs.js');
	const m = new main(config.hostname || config_filename || os.hostname());
	module.exports = m;
	m.argv = argv;
	m.add_app_dir(path.dirname(argv.config || "osiota.json"));

	if (argv.check) {
		const validation_errors = m.application_manager.check_config(
				config);
		if (validation_errors) {
			console.error("Config is not valid");
			console.info("Validation Errors:",
					validation_errors.filter(function(e) {
				return e.keyword !== 'enum' ||
					!e.dataPath.match(/^\.app.*\.name$/) ||
					e.message !== 'should be equal to one of the allowed values';
			}));
			process.exit(1);
		}

		console.info("Config is valid");
		return;
	}

	m.on("config_save", function() {
		const _this = this;
		setImmediate(function() {
			helper_config_file.write(
				argv.config || "osiota.json",
				m._config);
		});
	});

	if (argv.app) {
		// Save config in main object (to pass it to the app):
		m._config = config;

		// call cli function of an app:
		if (argv.help) {
			console.info('Usage: osiota --app %s [args]\n',
					argv.app);
			console.info("Application Options:");
		}
		m.loaded = (async ()=>{
			try {
				//const apps = await m.application_loader.startup(/*node=*/ null, argv.app);
				//const a = apps[0];
				const { ApplicationInterface } = require('./application_interface.js');
				const a = new ApplicationInterface(m, m.application_loader, m.node("/app"), {
					"name": argv.app
				})
				await a.cli(argv, argv.help);
			} catch(err) {
				console.error(err);
			}
		})();
		return;
	}

	if (daemon.process_status(pid_file)) {
		return console.error(
			"Error: An other process is still running.");
	}
	if (process.env.__daemon)
		daemon.pidfile_create(pid_file);

	// do config reload on signal
	process.on('SIGUSR2', /* istanbul ignore next tested in test/61 */
			function() {
		console.log("reloading config ...");
		m.close();
		setTimeout(function() {
			config = helper_config_file.read(argv.config);
			m.config(config);
		}, 5000);
	});

	// Load configuration:
	m.config(config);
}
