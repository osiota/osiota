const execFile = require('child_process').execFile;

exports.default_metadata = {
	"type": "state.state"
};

exports.init = function(node, app_config, main, host_info) {
	var command = "echo";
	if (typeof app_config.command === "string") {
		command = app_config.command;
	}
	var args = [];
	if (typeof app_config.args === "object" &&
			Array.isArray(app_config.args)) {
		args = app_config.args;
	}
	var map_stdout = false;
	if (typeof app_config.map_stdout === "boolean") {
		map_stdout = app_config.map_stdout;
	}
	node.announce([this.default_metadata, app_config.metadata]);

	node.rpc_set = function(reply, value) {
		var l_args = JSON.parse(JSON.stringify(args));
		l_args.push(value);
		if (!map_stdout) {
			node.publish(undefined, value);
		}

		execFile(command, l_args, function (error, stdout, stderr) {
			if (error) {
				reply("Error executing command", error);
				return;
			}
			if (map_stdout) {
				node.publish(undefined, stdout.toString()
						.replace(/[\r\n]+$/,""));
			}
			reply(null, "ok");
		});
	};

	return [node];
};

