#!/usr/bin/node

var Router = require('./router.js').router;
var r = new Router();

require('./router_console_in.js').init(r, "");
require('./router_random_in.js').init(r, "/random", 20, 0, 100);

require('./router_usbdmx.js').init(r, "/dmx", {device: '/dev/cu.wchusbserial640'}, {
	"/led/r": 2,
	"/led/g": 3,
	"/led/b": 4,
	"/led/main": 5,
	"/led/flash": 6	
});

r.node("/dmx/led/main_s").publish(new Date() / 1000, 255);
r.node("/dmx/led/r_s").publish(new Date() / 1000, 255);

