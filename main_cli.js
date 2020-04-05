#!/usr/bin/env node

var daemon = require('./helper_daemon.js');
var argv = require('minimist')(process.argv.slice(2));

var config_file = argv.config || "config.json";
var log_file = config_file.replace(/\.json$/i, "") + ".log";
var pid_file = config_file.replace(/\.json$/i, "") + ".pid";

if (argv.help || argv.h) {
	console.info('Usage: osiota [args]\n' +
		'\n' +
		'Options:\n' +
		'  --config, -c  Path to the config file\n' +
		'                (default: "config.json")\n' +
		'  --status, -s  Get status of the daemon\n' +
		'  --daemon, -d  Daemonize the process\n' +
		'  --stop, -k    Stop a process\n' +
		'  --load, -l    Load an app\n' +
		'  --version     Show version\n' +
		'  --help        Show help text\n' +
		'\n' +
		'Example:\n' +
		'  osiota --config myconfig.json --daemon\n');

} else if (argv.version || argv.v) {
	console.info(require("./package.json").version);

} else if (argv.stop || argv.k) {
	var pid = daemon.process_status(pid_file);
	if (!pid) {
		return console.error("Error: no PID file");
	}
	daemon.process_stop(pid, function() {
		daemon.pidfile_delete(pid_file);
	});

} else if (argv.status || argv.s) {
	return console.log("Status:",
		daemon.process_status(pid_file) ? "running" : "stopped");

} else if ((argv.daemon || argv.d) && !process.env.__daemon) {
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
	if (!argv.load && !argv.l) {
		config_file = null;
	}

	var fs = require('fs');
	var os = require('os');
	var main = require('./main_nodejs.js');

	// optional better console output:
	try {
		require('console-stamp')(console, 'yyyy-mm-dd HH:MM:ss');
	} catch(err) {}

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

	var m = new main(config.hostname || os.hostname());
	m.on("config_save", function() {
		var _this = this;
		fs.writeFile(config_file,
				JSON.stringify(config, null, '\t')+"\n",
				function(err) {
			if (err) {
				throw err;
			}
		});
	});

	// do config reload on signal
	process.on('SIGUSR2', function() {
		console.log("reloading config ...");
		m.close();
		setTimeout(function() {
			config = JSON.parse(
				fs.readFileSync(config_file)
			);
			m.config(config);
		}, 5000);
	});

	m.argv = argv;
	m.config(config);

	// call cli function of an app:
	if (argv.load || argv.l) {
		m.startup(null, argv.load || argv.l, undefined, undefined,
				undefined, function(a, level) {
			if (level !== 1) return;
			a._cli(argv, argv["help-app"]);
		});
	}
}
