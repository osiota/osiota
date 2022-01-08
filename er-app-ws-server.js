exports.inherit = ["load-on-started"];

exports.init_delayed = function(node, app_config, main, host_info) {
	if (typeof app_config.server !== "number" || !app_config.server) {
		console.info("config setting 'server' not set. " +
				"Not starting server.");
		return;
	}
	return main.create_websocket_server(app_config.server);
};
