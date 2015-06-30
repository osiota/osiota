#!/usr/bin/node

// initialise the Router
var Router = require('./router.js').router;
var r = new Router();

// add router moules:
require('./router_console_out.js')
	.init(r, "/console");
require('./router_websocket_client.js')
	.init(r, "/wsc", "ws://134.169.61.26:8080/");
require('./router_childprocess.js')
	.init(r, "/ethercat", "../ethercat_bridge/main",
			["../ethercat_bridge/config.csv"]);

// get the hostname:
var os = require("os");
var hostname = os.hostname();

// route all nodes to the WebSocketClient:
setTimeout(function(router) {
	var nodes = router.get_nodes();
	for (var name in nodes) {
		if (nodes.hasOwnProperty(name)) {
			console.log("# Rerouting '" + name + "' via WebSocket to '/" + hostname + name + "'");
			router.register(name, "wsc", "/" + hostname + name);
		}
	}
	
}, 2000, r);


