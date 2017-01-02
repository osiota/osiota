/*
 * This module starts a child process to collect or send data to other processes via stdin and stdout.
 * The data format is decribed in the documentation.
 */
exports.init = function(node, app_config, main, host_info) {
	var basename = app_config.basename;
	var command = app_config.command;
	var args = app_config.args;

	// initialize the child process:
	var spawn = require('child_process').spawn;
	var childProcess = spawn(command, args);
	childProcess.stdin.setEncoding('utf8');
	childProcess.stdout.setEncoding('utf8');
	childProcess.stderr.setEncoding('utf8');

	childProcess.stdout.on("data", function (data) {
		//console.error("LOG "+data.toString());
		var str = data.toString();
		var lines = str.split(/\r?\n/g);
		for (var i=0; i<lines.length; i++) {
			if (lines[i] != "") {
				//console.log("LOG "+lines[i]);
				var result = lines[i].match(/^([^\[]+)\s+\[([0-9.]+)\]:\s+([-0-9.]+)$/);
				if (result) {
					var name = result[1];
					var time = 1 * result[2];
					var value = 1 * result[3];
					if (result[3] == "null")
						value = null;

					node(basename + name).publish(time, value);
				} else {
					// connect:
					var result = lines[i].match(/^connect\s+([^\[]+)\s*$/);
					if (result) {
						let name = result[1];

						node(basename + name).subscribe(function() {
							childProcess.stdin.write(name + " [" + this.time + "]:\t" + this.value + "\n");

						});
					}
				}
			}
		}
	});

	childProcess.stderr.on("data", function (data) {
		console.error(data.toString().replace(/(\n|\r)+$/, ''));
		//console.error("Error in child_process: "+data.toString() +"\n"
		//	+ "Command: " + command + " " + args);
	});
	process.on('exit', function () {
		childProcess.kill();
	});
};

