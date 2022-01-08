exports.inherit = ["load-on-started"];

exports.init_delayed = function(node, app_config, main, host_info) {
	if (typeof app_config.server !== "number" || !app_config.server) {
		console.info("config setting 'server' not set. " +
				"Not starting server.");
		return;
	}
	return this.create_websocket_server(app_config.server);
};

exports.create_websocket_server = function(server_port) {
	var wss = require('./router_websocket_server').init(this._main.router, "", server_port);
	//this._main.router.policy_checker.add_observed_connection(wss.wpath);
	return wss;
};
