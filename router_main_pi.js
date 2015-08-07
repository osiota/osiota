#!/usr/bin/node

var Router = require('./router.js').router;
var r = new Router();

require('./router_jsonconnect.js').init(r, "http://localhost/energy/get_sensors.php");

require('./router_console_out.js').init(r, "/console");
require('./router_websockets.js').init(r, "/ws", 8080);
require('./router_console_in.js').init(r, "");
//require('./router_random_in.js').init(r, "/ethercat/Engel/Energie_P1", 20, 0, 100);
require('./router_childprocess.js').init(r, "/plugwise", "/home/pi/plugwise_bridge/scripts/plugwise_log.pl", ["/dev/ttyUSB0"]);

require('./router_io_function.js').init(r);
require('./router_io_mean.js').init(r);
require('./router_io_bias.js').init(r);
require('./router_io_multiply.js').init(r);
require('./router_io_sum.js').init(r);


var static_routes = require('./config_static_routes_pi.js').static_routes;
for (var from in static_routes) {
	if (typeof static_routes[from] === "Array") {
		for (var tid=0; tid<static_routes[from].length; tid++) {
			r.connect(from, static_routes[from][tid]);
		}
	} else {
		r.connect(from, static_routes[from]);
	}
}

//r.register('/ethercat/CNC/Global_voltage', 'multiply', '/ethercat/CNC/Exhaust', '/ethercat/CNC/Exhaust_current');
r.register('/plugwise/s_278EDF8', 'sum', '/energy', [
		"/plugwise/s_28FB858",
		"/plugwise/s_28FBB58",
		"/plugwise/s_28FD198",
		"/plugwise/s_28FD31F",
		"/plugwise/s_28FD32D",
		"/plugwise/s_28FD4EE"
]);

