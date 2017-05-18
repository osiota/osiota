/*
 * This module starts a child process to collect or send data to other processes via stdin and stdout.
 * The data format is decribed in the documentation.
 */
exports.init = function(router, basename, command, args) {
	// initialize the child process:
	var spawn = require('child_process').spawn;
	var childProcess = spawn(command, args);
	childProcess.stdin.setEncoding('utf8');
	childProcess.stdout.setEncoding('utf8');
	childProcess.stderr.setEncoding('utf8');

	var buffer = "";
	childProcess.stdout.on("data", function (data) {
		//console.error("LOG "+data.toString());
		buffer += data.toString();
		var lines = buffer.split(/\r?\n/g);
		for (var i=0; i<lines.length-1; i++) {
			if (lines[i] != "") {
				//console.log("LOG "+lines[i]);
				var result = lines[i].match(/^([^\[]+)\s+\[([0-9.]+)\]:\s+([-0-9.]+)$/);
				if (result) {
					var name = result[1];
					var time = 1 * result[2];
					var value = 1 * result[3];
					if (result[3] == "null")
						value = null;

					router.node(basename + name).publish(time, value);
				} else {
					// connect:
					var result = lines[i].match(/^connect\s+([^\[]+)\s*$/);
					if (result) {
						var node = result[1];

						var rentry = router.node(basename + node).register("childprocess", node, undefined, false);
					}
				}
			}
		}
		buffer = lines[lines.length-1];
	});

	childProcess.stderr.on("data", function (data) {
		console.error(data.toString().replace(/(\n|\r)+$/, ''));
		//console.error("Error in child_process: "+data.toString() + "\n"
		//	+ "Command: " + command + " " + args);
	});
	process.on('exit', function () {
		childProcess.kill();
	});

	router.dests.childprocess = function(node) {
		// this = rentry

		//console.log("Router, Childprocess: sending: ", node.value);
		childProcess.stdin.write(this.id + " [" + node.time + "]:\t" + node.value + "\n");
	};
};

