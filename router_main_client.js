#!/usr/bin/node

var argv = require('optimist').argv;

var ws_server = "ws://localhost:8080/";
if (argv.s)
	ws_server = argv.s;


// initialise the Router
var Router = require('./router.js').router;
var r = new Router();

// add router moules:
require('./router_console_out.js')
	.init(r, "/console");
require('./router_websocket_client.js')
		.init(r, "", ws_server, function(o_ws) {
	console.log("Connected.");
	if (argv.list)
		o_ws.sendjson({"type":"list"});

	if (argv._.length > 0) {
		var node = argv._;
		o_ws.request(node);
		r.register(node, "console", node);
	} else {
		console.log("no node registered. existing ...");
		setTimeout(function() { process.exit(); }, 1000);
	}
});

