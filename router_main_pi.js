#!/usr/bin/node

var Router = require('./router.js').router;
var r = new Router("IfN, Teeküche (Raspberry Pi)");

//require('./router_jsonconnect.js').init(r, "http://localhost/energy/get_sensors.php");

require('./router_console_out.js').init(r, "/console");
require('./router_websockets.js').init(r, "", 8080);
require('./router_console_in.js').init(r, "");
//require('./router_random_in.js').init(r, "/ethercat/Engel/Energie_P1", 20, 0, 100);

require('./module_history.js').init(r, 'ram');

// Start the plugwise daemon as a child process:
require('./router_childprocess.js').init(r, "/plugwise", "../energy-router-plugwise/plugwise_log.pl", ["/dev/ttyUSB0"]);

require('./router_io_function.js').init(r);
require('./router_io_mean.js').init(r);
require('./router_io_bias.js').init(r);
require('./router_io_multiply.js').init(r);
require('./router_io_sum.js').init(r);

r.connectArray(
	require('./config_static_routes_pi.js').static_routes
);


require('./router_websocket_sendto.js').init(r, "ws://sw.nerdbox.de:8081/", ['/Küche']);

