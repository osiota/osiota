
exports.init = function(node, app_config, main, host_info) {
	if (typeof app_config.command !== "string") {
		app_config.command = "cat";
	}
	if (typeof app_config.args !== "object" ||
			!Array.isArray(app_config.args)) {
		app_config.args = [];
	}

	node.announce({
		"type": "shell.log"
	});

	const spawn = require('child_process').spawn;
	const childProcess = spawn(app_config.command, app_config.args);
	childProcess.stdin.setEncoding('utf8');
	childProcess.stdout.setEncoding('utf8');
	childProcess.stderr.setEncoding('utf8');

	childProcess.stdout.on("data", function (data) {
		const str = data.toString();
		node.publish(undefined, str);
	});

	childProcess.stderr.on("data", function (data) {
		const str = data.toString();
		node.publish(undefined, str);
	});

	node.rpc_command = function(reply, command) {
		console.log("Command: " + command);
		childProcess.stdin.write(command + "\n");

		reply(null, "ok");
	};

	return [node, function() {
		childProcess.kill();
	}];
};

