#!/usr/bin/env node

var argv = require('yargs')
	.usage( 'Connect to a data router.\n'+
		'Usage: $0 [-args] [nodes ...]', {
		server: {
			alias: "s",
			describe: "WebSocket server to connect to",
			default: "ws://localhost:8080/",
			type: "string"
		},
		list: {
			alias: "l",
			describe: "List nodes of the server",
			default: false,
			type: "boolean"
		},
		history: {
			alias: "his",
			describe: "Get historical data with interval for all given nodes\ninterval in seconds",
			default: null,
			type: "number"
		}
	})
	.example('$0 -s ws://server05:8080/ /random', '- Get data from node "random" of server05')
	.help().version().config()
	.argv;

// initialise the Router
var Router = require('./router.js').router;
var r = new Router("energy-router, command line client");

// add router moules:
require('./module_history.js').init(r, 'ram', {
	"maxCount": 3000,
	"timebases": [
		{
			"delta_t": 0,
			"filename": "level_db_raw"
		},
		{
			"delta_t": 1,
			"filename": "level_db_sec"
		},
		{
			"delta_t": 60,
			"filename": "level_db_min"
		},
		{
			"delta_t": 60*60,
			"filename": "level_db_hour"
		}
	]
});

require('./router_console_out.js')
	.init(r, "");
require('./router_websocket_client.js')
		.init(r, "", argv.server, function(ws) {
	console.log("Connected.");
	if (argv.list)
		ws.rpc("list", function(error, data) {
			if (error) throw error;
			console.log("list:\n", data);
		});

	if (argv._.length > 0) {
		for(i=0; i<argv._.length; i++) {
			var nodeName = argv._[i].toString();
			if (argv.history !== null) {
				ws.node_rpc(nodeName, "history", {
					"interval": argv.history,
//					"maxCount": 3000,
					"fromTime": 0
				}, function(data) {
					console.log("history:", data);
				});
			} else {
				var node = r.node(nodeName);
				if (typeof node.history.history_data[node.history.history_data.length - 1] !== "undefined")
					var fromtime = node.history.history_data[node.history.history_data.length - 1].time;
				else
					var fromtime = 0;
				console.log("lasttime", fromtime);
				ws.subscribe(nodeName);
			}
		}
	} else {
		console.log("no node registered. existing ...");
		setTimeout(function() { process.exit(); }, 1000);
	}
});

