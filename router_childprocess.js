
exports.init = function(router, basename, command, args) {
	//var command = "../ethercat_bridge/main";
	//var args = "";

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
					var time = result[2];
					var value = 1 * result[3];
					if (result[3] == "null")
						value = null;

					router.route(basename + name, time, value);
				} else {
					// connect:
					var result = lines[i].match(/^connect\s+([^\[]+)\s*$/);
					if (result) {
						var node = result[1];

						var rentry = router.register(basename + node, "ethercat", node, undefined, false);
					}
				}
			}
		}
	});

	childProcess.stderr.on("data", function (data) {
		console.error(data.toString().replace(/(\n|\r)+$/, ''));
		//console.error("Error in child_process: "+data.toString() + "\n"
		//	+ "Command: " + command + " " + args);
	});

	router.dests.ethercat = function(id, time, value) {
		childProcess.stdin.write(id + " [" + time + "]:\t" + value);
	};
};

