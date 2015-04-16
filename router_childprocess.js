
exports.init = function(router, basename, command, args) {
	//var command = "../ethercat_bridge/main";
	//var args = "";

	var spawn = require('child_process').spawn;
	var childProcess = spawn(command, args);
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
					var value = result[3];
					router.route(basename + name, time, value);
				}
			}
		}
	});

	childProcess.stderr.on("data", function (data) {
		console.error("Error in child_process: "+data.toString() + "\n"
			+ "Command: " + command + " " + args);
	});
};

