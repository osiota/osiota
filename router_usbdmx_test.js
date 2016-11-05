#!/usr/bin/node

var Router = require('./router.js').router;
var r = new Router();

require('./router_console_in.js').init(r, "");
require('./router_random_in.js').init(r, "/random", 20, 0, 100);

var a = 8;

require('./router_usbdmx.js').init(r, "/dmx", {device: '/dev/cu.wchusbserial640'}, {
	"/led/r": a+0,
	"/led/g": a+1,
	"/led/b": a+2,
	"/led/main": a+3,
	"/led/flash": a+4
});

r.node("/dmx/led/main_s").publish(undefined, 255);
r.node("/dmx/led/r_s").publish(undefined, 255);
r.node("/dmx/led/g_s").publish(undefined, 255);
r.node("/dmx/led/b_s").publish(undefined, 255);

