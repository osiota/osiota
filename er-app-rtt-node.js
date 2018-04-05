
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
	var repeat = 1;
	if (typeof app_config.repeat === "number") {
		repeat = app_config.repeat;
	}
	if (typeof app_config.remote_node !== "string") {
		return;
	}
	var remote_node = node.node(app_config.remote_node);

	node.announce({
		"type": "rtt.data"
	});
	var tid = setInterval(function() {
		if (!remote_node.connection) {
			node.publish(undefined, null);
			return;
		}
		for (var i=0; i<repeat; i++) {
			let t = process.hrtime();
			remote_node.rpc("ping", function(err) {
				if (err) throw err;

				var diff = process.hrtime(t);
				var delta = diff[0] * 1e9 + diff[1];

				node.publish(undefined, delta / 1e6);
			});
		}
	}, 1000 * interval);

	return [tid, node];
};
