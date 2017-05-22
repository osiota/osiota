
exports.init = function(node, app_config, main, host_info) {
	var interval = app_config.interval;
	var remote_node = node(app_config.remote_node);

	main.router.rpc_node_ping = function(reply) {
		reply(null, "okay");
	};

	if (typeof interval === "number" && interval) {
		setInterval(function() {
			var t_start = new Date()*1;
			if (!remotes.hasOwnProperty(remote)) {
					node.publish(undefined, null);
			} else {
				remotes[remote].rpc("ping", function(err) {
					if (err) throw err;
					var t = new Date()*1 - t_start;
					node.publish(t_start/1000, t);
				});
			}
		}, 1000 * interval);
	}
};
