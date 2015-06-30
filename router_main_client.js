#!/usr/bin/node

var args = process.argv.slice(2);

// initialise the Router
var Router = require('./router.js').router;
var r = new Router();

// add router moules:
require('./router_console_out.js')
	.init(r, "/console");
require('./router_websocket_client.js')
		.init(r, "/wsc", "ws://134.169.61.26:8080/", function(o_ws) {
	console.log("Connected.");
	if (args[0] == "list") {
		o_ws.sendjson({"type":"list"});
	} else if (args[0] != "") {
		var node = args[0];
		o_ws.request(node);
		r.register("/wsc" + node, "console", node);
	} else {
		console.log("no arg given");
	}
});

