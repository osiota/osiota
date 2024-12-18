const http = require('http');

exports.inherit = ["load-on-started"];


exports.init_delayed = async function(node, app_config, main, host_info) {
	if (typeof app_config.port !== "number" &&
			typeof app_config.server !== "number") {
		console.info("config setting 'port' not set. " +
				"Not starting WebSocket server.");
		return;
	}

	const server = await this.create_server(app_config, main);

	const wss = this.create_websocket_server({
		"server": server
	});

	server.listen(app_config.port || app_config.server);

	return [wss, server];
}

exports.create_websocket_server = function(server) {
	var wss = require('./router_websocket_server').init(this._main, this._main.rpcstack, "", server);
	//this._main.router.policy_checker.add_observed_connection(wss.wpath);
	return wss;
};

exports.create_server = async function(app_config) {
	const uiserver = app_config.uiserver || "osiota.net/ui/";
	var server = http.createServer((req, res) => {
		var hostAndPort = req.headers.host;
		var protocol = 'ws://';
		var uiconfig = {
			wpath: protocol + hostAndPort + req.url,
		};
		var protocolHttp = 'http://';
		var redirectUrl = protocolHttp + uiserver + "#" +
				JSON.stringify(uiconfig);

		res.writeHead(302, { Location: redirectUrl });
		res.end();
	});
	return server;
};
