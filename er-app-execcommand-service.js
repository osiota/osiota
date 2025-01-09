var execFile = require('child_process').execFile;

exports.default_metadata = {
	"type": "output.state",
	"button": true
};

exports.init = function(node, app_config) {
	var command = "echo";
	if (typeof app_config.command === "string") {
		command = app_config.command;
	}
	var args = [];
	if (typeof app_config.args === "object" &&
			Array.isArray(app_config.args)) {
		args = app_config.args;
	}
	node.announce([this.default_metadata, app_config.metadata]);
	node.publish(undefined, 0);

	var instance = null;
	node.rpc_set = function(reply, value, time) {
		console.log("ECS set", value);
		if (instance) {
			instance.kill();
			console.log("ECS kill");
			let _instance = instance;
			let tid = setTimeout(function() {
				_instance.kill("SIGKILL");
			}, 1000);
			tid.unref();
			instance = null;
		}
		if (!value) {
			reply(null, "ok");
			return;
		}

		console.log("ECS exec", command, args);
		let _instance = execFile(command, args,
				function(error, stdout, stderr) {
			console.log("ECS closed", stdout, stderr);
			node.publish(undefined, 0);
			if (error) {
				if (!_instance.killed)
					reply("Error executing command", error);
				return;
			}
		});
		instance = _instance;
		node.publish(undefined, 1);
		reply(null, "ok");
	};
	node.rpc_toggle = function(reply, time) {
                return this.rpc_set(reply, this.value ? 0 : 1, time);
        };

	if (app_config.autostart) {
		node.rpc("set", 1);
	}

	return [function() {
		node.rpc("set", 0);	
	}, node];
};
