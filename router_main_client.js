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
	.init(r, "/");
require('./router_websocket_client.js')
		.init(r, "", argv.server, function(o_ws) {
	console.log("Connected.");
	if (argv.list)
		o_ws.rpc("list", function(data) {
			console.log("list:\n", data);
		});

	if (argv._.length > 0) {
		for(i=0; i<argv._.length; i++) {
			var nodeName = argv._[i].toString();
			if (argv.history !== null) {
				o_ws.node_rpc(nodeName, "history", {
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
				o_ws.node_rpc(nodeName, "bind");
				o_ws.node_rpc(nodeName, "history", {
					"interval": 0,
					"maxentries": null,
					"fromtime": fromtime
				}, function(data) {
					// newest element is added via bind
					data.pop()
					console.log("history:", data)
					data.forEach(function(d) {
						node.history.add(d.time, d.value);
					});
				});
			}
		}
	} else {
		console.log("no node registered. existing ...");
		setTimeout(function() { process.exit(); }, 1000);
	}
});

