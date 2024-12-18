const http = require('http');

exports.inherit = ["ws-server"];


exports.init_delayed = async function(node, app_config, main, host_info) {
	if (typeof app_config.port !== "number" &&
			typeof app_config.server !== "number") {
		console.info("config setting 'port' not set. " +
				"Not starting WebSocket server.");
		return;
	}

	const wss = this.create_websocket_server({
		"server": app_config.port || app_config.server
	});

	server.listen(app_config.port || app_config.server);

	return [wss, server];
}

