
exports.init = function(node, app_config, main, host_info) {
	var interval = app_config.interval;
	var remote = app_config.remote;

	//main.router.rpc_ping = function(reply) {
	//	reply(null, "okay");
	//};

	if (typeof interval === "number" && interval) {
		setInterval(function() {
			var t_start = new Date()*1;
			ws.rpc("ping", function() {
				var t = new Date()*1 - t_start;
				node.publish(t_start/1000, t);
			});

		}, 1000 * interval);
	}
};

