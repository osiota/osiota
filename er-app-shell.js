
exports.init = function(node, app_config, main, host_info) {
	if (typeof app_config !== "object") {
		app_config = {};
	}
	if (typeof app_config.command !== "string") {
		app_config.command = "ls";
	}
	if (typeof app_config.args !== "object" || Array.isArray(app_config.args)) {
		app_config.args = [];
	}

	var spawn = require('child_process').spawn;
	var childProcess = spawn(app_config.command, app_config.args);
	childProcess.stdin.setEncoding('utf8');
	childProcess.stdout.setEncoding('utf8');
	childProcess.stderr.setEncoding('utf8');

	childProcess.stdout.on("data", function (data) {
		var str = data.toString();
		node.publish(undefined, str);
	});

	childProcess.stderr.on("data", function (data) {
		var str = data.toString();
		node.publish(undefined, str);
	});
	process.on('exit', function () {
		childProcess.kill();
	});

	node.rpc_command = function(reply, command) {
		var node = this;

		console.log("Command: " + command);
		childProcess.stdin.write(command + "\n");

		reply(null, "ok");
	};

};

