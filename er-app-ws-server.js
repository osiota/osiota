const http = require('http');
const os = require('os');

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

	const ip = this.get_current_ip();
	const port = app_config.port || app_config.server;
	server.listen(port, ()=>{
		if (!process.env.OSIOTA_TEST) {
			console.info(`Server running at ${this.protocol}localhost:${port} and ${this.protocol}${ip}:${port}`);
			console.info(`Connect via ${this.protocolHttp}localhost:${port} or ${this.protocolHttp}${ip}:${port}`);
		}
	});

	return [wss, server];
}

exports.protocolHttp = 'http://';
exports.protocol = 'ws://';

function escapeForJsString(str) {
	return str
		.replace(/</g, '\\u003C')
		.replace(/>/g, '\\u003E')
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r')
		.replace(/\0/g, '\\0')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029')
		.replace(/<\/script>/gi, '<\\/script>');
}


exports.create_websocket_server = function(server) {
	const wss = require('./router_websocket_server').init(this._main, this._main.rpcstack, "", server);
	//this._main.router.policy_checker.add_observed_connection(wss.wpath);
	return wss;
};

exports.redirect_page = function(app_config, req, res) {
	const uiserver = app_config.uiserver || "osiota.net/ui/";
	const hostAndPort = req.headers.host.replace(/[^A-Za-z0-9.:-]+/, "");
	const uiconfig = {
		wpath: this.protocol + hostAndPort + req.url,
		...app_config.uiconfig,
	};
	const redirectUrl = this.protocolHttp + uiserver + "#" +
		JSON.stringify(uiconfig);

	return this.redirect_page_content(res, redirectUrl);
};

exports.redirect_page_content = function(res, redirectUrl) {
	// this forwards to https sometimes:
	//res.writeHead(302, { Location: redirectUrl });
	//res.end();
	res.writeHead(200, { 'Content-Type': 'text/html' });
	const redirectUrlStr = escapeForJsString(JSON.stringify(redirectUrl));
	res.end(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Redirecting...</title><script>setTimeout(()=>{window.location.href = ${redirectUrlStr}; }, 10);</script><style>body{background:black; margin:25%}*{color:#222222}</style></head><body><h1>Redirecting...</h1><p>If you are not redirected automatically, follow this <a href=${redirectUrlStr}>link</a>.</p></body></html>`);
};

exports.create_server = async function(app_config) {
	const server = http.createServer(
			this.redirect_page.bind(this, app_config));
	return server;
};

exports.get_current_ip = function() {
	const interfaces = os.networkInterfaces();
	for (const interfaceName in interfaces) {
		for (const iface of interfaces[interfaceName]) {
			if (iface.family === 'IPv4' && !iface.internal) {
				return iface.address;
			}
		}
	}
	return '127.0.0.1';
}
