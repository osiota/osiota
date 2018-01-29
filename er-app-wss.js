
exports.init = function(node, app_config, main) {
	var wss = null;
	if (typeof app_config.server !== "undefined" && app_config.server) {
		wss = main.create_websocket_server(app_config.server);
	}

	return wss;
};
