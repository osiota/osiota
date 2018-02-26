
exports.init = function(node, app_config, main, host_info) {
	if (typeof app_config.server !== "number" || !app_config.server) {
		console.info("config setting 'server' not set. " +
				"Not starting server.");
		return;
	}
	var wss = [];

	main.on("started", function() {
		wss[0] = main.create_websocket_server(app_config.server);
	//_this.router.policy_checker.add_observed_connection(c.url);

	});

	return wss;
};
