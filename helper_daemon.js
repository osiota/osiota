const fs = require('fs');
const child_process = require('child_process');

/**
 * Get the status of a process
 * @param {string} - Path of the pid file
 */
exports.process_status = function(pid_file) {
	try {
		var pid = fs.readFileSync(pid_file);
		process.kill(pid, 0);
		return pid;
	} catch (err) {
	}
	return false;
};

/**
 * Stop a Process
 * @param {number} pid - Process id
 * @param {callback} next - Callback fired after process termination
 */
exports.process_stop = function(pid, next, count = 0) {
	try {
		if (count == 0) {
			// send terminate signal:
			process.kill(pid); // 'SIGTERM'
		} else if (count < 80) { // = 8 seconds
			// check process:
			process.kill(pid, 0);
		} else {
			// send kill signal:
			process.kill(pid, 'SIGKILL');
			return next();
		}
		setTimeout(function() {
			exports.process_stop(pid, next, count+1);
		}, 100);
	} catch(err) {
		// no such process
		return next();
	}
};

/**
 * Start the same script as daemon
 * @param {string} log_file - Path of the log file to redirect console output
 */
exports.daemon_start = function(log_file) {
	// TODO: Move old log-files:
	//fs.renameSync(log_file, log_file.replace(/\.log/, ".1.log");
	var log_fid = fs.openSync(log_file, 'w');

	// process args:
	var args = Array.prototype.slice.call(process.argv, 1);

	var cwd = process.cwd();
	var env = process.env;

	// Mark subprocess
	env.__daemon = true;

	// spawn subprocess
	var child = child_process.spawn(process.execPath, args, {
		stdio: ['ignore', log_fid, log_fid],
		env: env,
		cwd: cwd,
		detached: true
	});

	// unref subprocess so this process can exit
	child.unref();
	return process.exit();
};

/**
 * Create a pid file
 * @param {string} pid_file - Path of the pid file
 */
exports.pidfile_create = function(pid_file) {
	// create pid file:
	fs.writeFileSync(pid_file, ""+process.pid);
};
/**
 * Delete a pid file
 * @param {string} pid_file - Path of the pid file
 */
exports.pidfile_delete = function(pid_file) {
	fs.unlinkSync(pid_file);
};
