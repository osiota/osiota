
exports.init = function(node, app_config, main, host_info) {
	// add ping function:
	main.router.rpc_ping = function(reply) {
		reply(null, "okay");
	};

	// check arguments:
	var interval = 1;
	if (typeof app_config.interval === "number") {
		interval = app_config.interval;
	}
	if (typeof app_config.remote !== "string" || app_config.remote === "") {
		return;
	}
	//var remote = "upstream";
	var remote = app_config.remote;

	node.announce({
		"type": "rtt.data"
	});

	var tid = setInterval(function() {
		var t_start = new Date();
		if (!remotes.hasOwnProperty(remote)) {
			node.publish(undefined, null);
		} else {
			remotes[remote].rpc("ping", function(err) {
				if (err) throw err;
				var t = new Date() - t_start;
				node.publish(t_start/1000, t);
			});
		}
	}, 1000 * interval);

	return [tid, node];
};

