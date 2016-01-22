#!/usr/bin/node

var optimist = require('optimist')
	.usage('Connect to a data router.\nUsage: $0 [nodes ...]')
	.alias('server', 's')
	.describe('server', 'WebSocketServer to connect to.')
	.default('server', "ws://localhost:8080/")
	.boolean('list')
	.alias('list', 'l')
	.describe('list', 'List nodes of the router')
	.alias('history', 'his')
	.describe('history', 'Get history data with interval for all nodes\n\tinterval in seconds')
	.default('history', null)
	.alias('help', 'h')
	.describe('help', 'Display the usage');
var argv = optimist.argv;

if (argv.help) {
	optimist.showHelp();
	process.exit(0);
}

// initialise the Router
var Router = require('./router.js').router;
var r = new Router();

// add router moules:
require('./router_console_out.js')
	.init(r, "/console");
require('./router_websocket_client.js')
		.init(r, "", argv.server, function(o_ws) {
	console.log("Connected.");
	if (argv.list)
		o_ws.rpc("list", function(data) {
			console.log("list:\n", data);
		});

	if (argv._.length > 0) {
		for(i=0; i<argv._.length; i++) {
			var node = argv._[i].toString();
			if (argv.history !== null) {
				o_ws.node_rpc(node, "get_history", argv.history, function(data) {
					console.log("get_history:", data);
				});
			} else {
				o_ws.node_rpc(node, "bind");
				r.register(node, "console", node);
			}
		}
	} else {
		console.log("no node registered. existing ...");
		setTimeout(function() { process.exit(); }, 1000);
	}
});

