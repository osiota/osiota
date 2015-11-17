
exports.init = function(router) {
	
	var exec = require('child_process').exec;

	router.dests.execcommand = function(node) {
		//console.log("Router, Exec Command: ", node.value);
		console.log("Command: " + this.id + " [" + node.time + "]:\t" + node.value + "\n");

		if (typeof node.value !== "undefined" && node.value !== null) {
			exec(this.id + " " + node.value, function (error, stdout, stderr) {
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

