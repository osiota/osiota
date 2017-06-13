
exports.init = function(node, app_config, main, host_info) {

	// add ping function:
	main.router.rpc_node_ping = function(reply) {
		reply(null, "okay");
	};

	// check arguments:
	var interval = 1;
	if (typeof app_config.interval === "number") {
		interval = app_config.interval;
	}
	if (typeof app_config.remote_node !== "string") {
		return;
	}
	var remote_node = node.node(app_config.remote_node);

	node.announce({
		"type": "rtt.data"
	});
	var tid = setInterval(function() {
		var t_start = new Date();

		// try?
		if (!remote_node.connection) {
			node.publish(undefined, null);
		} else {
			remote_node.rpc("ping", function(err) {
				if (err) throw err;
				var t = new Date() - t_start;
				node.publish(t_start/1000, t);
			});
		}
	}, 1000 * interval);

	return [tid, node];
};
