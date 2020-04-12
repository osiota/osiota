#!/usr/bin/env node

var daemon = require('./helper_daemon.js');
var argv = require('minimist')(process.argv.slice(2));

// Flags:
argv.help    = argv.help    || argv.h;
argv.daemon  = argv.daemon  || argv.d;
argv.restart = argv.restart;
argv.reload  = argv.reload  || argv.r;
argv.stop    = argv.stop    || argv.k;
argv.status  = argv.status  || argv.s;
argv.version = argv.version || argv.V;
argv.verbose = argv.verbose || argv.v;

if (argv.daemon && typeof argv.verbose === "undefined") {
	argv.verbose = true;
}
if (argv.restart && process.env.__daemon) {
	argv.restart = false;
	argv.daemon = true;
}

var config_file = argv.config || "config.json";
var log_file = config_file.replace(/\.json$/i, "") + ".log";
var pid_file = config_file.replace(/\.json$/i, "") + ".pid";
if (argv.app) config_file = null;

// helper:
var config_read = function() {
	var config = {};
	try {
		if (config_file) {
			config = JSON.parse(
				fs.readFileSync(config_file)
			);
		}
	} catch (err) {
		// Show JSON parsing errors:
		if (err.code !== "ENOENT") {
			return console.error(err);
		}
	}
	return config;
};
var config_write = function() {
	fs.writeFile(config_file || argv.config,
			JSON.stringify(config, null, '\t')+"\n",
			function(err) {
		if (err) {
			throw err;
		}
	});
};

if (argv.help && !argv.app) {
	console.info('Usage: osiota [args]\n');
	console.group();
	console.info('Options:\n' +
		'  --config [file]  Path to the config file\n' +
		'                 (default: "config.json")\n' +
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
	var pid = daemon.process_status(pid_file);
	if (!pid) {
		return console.error("Error: no running process found");
	}
	daemon.process_stop(pid, function() {
		daemon.pidfile_delete(pid_file);
	});

} else if (argv.restart) {
	var pid = daemon.process_status(pid_file);
	if (!pid) {
		console.warn("Warning: no running process found");
		daemon.daemon_start(log_file);
		return;
	}
	daemon.process_stop(pid, function() {
		daemon.pidfile_delete(pid_file);
		daemon.daemon_start(log_file);
	});

} else if (argv.reload) {
	var pid = daemon.process_status(pid_file);
	if (!pid) {
		return console.error("Error: no running process found");
	}
	process.kill(pid, 'SIGUSR2');

} else if (argv.status) {
	return console.log("Status:",
		daemon.process_status(pid_file) ? "running" : "stopped");

} else if (argv.daemon && !process.env.__daemon) {
	if (daemon.process_status(pid_file)) {
		return console.error(
			"Error: An other process is still running.");
	}
	daemon.daemon_start(log_file);

} else { // start
	if (daemon.process_status(pid_file)) {
		return console.error(
			"Error: An other process is still running.");
	}
	if (process.env.__daemon)
		daemon.pidfile_create(pid_file);

	var fs = require('fs');
	var os = require('os');
	var main = require('./main_nodejs.js');

	// optional better console output:
	if (!argv.help) {
		try {
			require('console-stamp')(console, {
				pattern: 'yyyy-mm-dd HH:MM:ss',
				extend: {
					debug: 5,
				},
				include: ['debug', 'log', 'info', 'warn', 'error'],
				level: 'debug',
			});
		} catch(err) {}
	}

	if (!argv.verbose) {
		// error
		// warn
		// info
		console.log = function() {};
		console.debug = function() {};
	}

	var config = config_read();
	var m = new main(config.hostname || os.hostname());
	m.on("config_save", function() {
		var _this = this;
		config_write(m._config);
	});

	// do config reload on signal
	process.on('SIGUSR2', function() {
		console.log("reloading config ...");
		m.close();
		setTimeout(function() {
			config = config_read();
			m.config(config);
		}, 5000);
	});

	m.argv = argv;
	m.config(config);

	// call cli function of an app:
	if (argv.app) {
		if (argv.help) {
			console.info('Usage: osiota [args]\n');
			console.info("Application Options:");
		}
		m.startup(null, argv.app, undefined, undefined,
				undefined, function(a, level) {
			if (level !== 1) return;
			a._cli(argv, argv.help);
		});
	}
}
