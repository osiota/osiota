#!/usr/bin/node

var Router = require('./router.js').router;
var r = new Router("WG");

require('./module_history.js').init(r, 'ram');

require('./router_console_out.js').init(r, "/console");
require('./router_websocket_server.js').init(r, "", 8080);
//require('./router_random_in.js').init(r, "/ethercat/Engel/Energie_P1", 20, 0, 100);

require('./router_io_function.js').init(r);
require('./router_io_mean.js').init(r);
require('./router_io_bias.js').init(r);
require('./router_io_multiply.js').init(r);
require('./router_io_sum.js').init(r);

require('./router_execcommand.js').init(r);

require('./router_rcswitch.js').init(r, "/WG", {
	"/Simon/Bettlampe":	"10011-4",
	"/Simon/Stein":		"10011-3",
	"/Simon/Strahler oben":	"10011-1",
	"/Simon/Strahler unten":	"10011-2",
	"/Simon/Schreibtischlampe":	"10100-1",
	"/Simon/Schreibtisch Spot":	"10100-2",
	"/Simon/Buntes Licht":	"10100-3",
	"/Simon/Sirene":	"10100-4"
});

