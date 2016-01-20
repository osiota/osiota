#!/usr/bin/node

var optimist = require('optimist')
	.usage('Connect to a data router.\nUsage: $0 [nodes ...]')
	.alias('port', 'p')
	.describe('port', 'WebSocket server port to open')
	.default('port', 8080)
	.alias('random', 'r')
	.describe('random', 'Insert a node with random data.')
	.default('random', false)
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

