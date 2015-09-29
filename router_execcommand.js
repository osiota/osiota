
exports.init = function(router) {
	
	var exec = require('child_process').exec;

	router.dests.execcommand = function(id, time, value, name, obj) {
		//console.log("Router, Exec Command: ", value);
		console.log("Command: " + id + " [" + time + "]:\t" + value + "\n");

		if (typeof value !== "undefined" && value !== null) {
			exec(id + " " + value, function (error, stdout, stderr) {
				if (stdout !== null && stdout != "")
					console.log('stdout: ' + stdout);
				if (stderr !== null && stderr != "")
					console.log('stderr: ' + stderr);
				if (error !== null) {
					console.log('exec error: ' + error);
				}
			});
		}
	};
};

