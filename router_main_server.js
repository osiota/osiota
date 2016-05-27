#!/usr/bin/node

var argv = require('yargs')
	.usage('Connect to a data router.\n'+
		'Usage: $0 [-args]', {
		port: {
			alias: "p",
			describe: "WebSocket server port to open",
			default: 8080,
			type: "number"
		},
		random: {
			alias: "r",
			describe: "Insert a node with random data",
			default: false,
			type: "boolean"
		}
	})
	.example('$0 -p 8081', "- Open server on port 8081")
	.help().version().config()
	.argv;

// initialise the Router
var Router = require('./router.js').router;
var r = new Router("energy-router, command line test server");

require('./module_history.js').init(r, 'ram');

// add router moules:
require('./router_console_out.js').init(r, "/console");
require('./router_websockets.js').init(r, "", argv.port);

require('./router_io_function.js').init(r);
require('./router_io_mean.js').init(r);
require('./router_io_bias.js').init(r);
require('./router_io_multiply.js').init(r);
require('./router_io_sum.js').init(r);

if (argv.random) {
	require('./router_random_in.js').init(r, "/random", 20, 0, 100);
}

