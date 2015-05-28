#!/usr/bin/node

var mysql_config = {
	host     : 'pul.iwf.ing.tu-bs.de',
	user     : 'exfab',
	password : 'PSprfU6DcMMChWYC',
	database : 'Experimentierfabrik'
};

var Router = require('./router.js').router;
var r = new Router();

require('./router_mysql.js').init(r, "/mysql", mysql_config);
require('./router_console_out.js').init(r, "/console");
require('./router_websockets.js').init(r, "/ws", 8080);
require('./router_console_in.js').init(r, "");
//require('./router_random_in.js').init(r, "/ethercat/Engel/Energie_P1", 20, 0, 100);
require('./router_childprocess.js').init(r, "/ethercat", "../ethercat_bridge/main", ["../ethercat_bridge/config.csv"]);

require('./router_io_function.js').init(r);
require('./router_io_mean.js').init(r);
require('./router_io_multiply.js').init(r);
require('./router_io_sum.js').init(r);

var static_routes = require('./config_static_routes.js').static_routes;
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
r.register('/ethercat/CNC/PLC', 'sum', '/exlab/All', [
		'/ethercat/CNC/Spindle',
		'/ethercat/CNC/Position',
		'/ethercat/TransportB/PLC',
		'/ethercat/Switch/PLC',
		'/ethercat/Press/PLC',
		'/ethercat/Assembling/PLC',
		'/ethercat/TransportA/PLC',
		'/ethercat/DistributionA/PLC',
		'/ethercat/DistributionB/PLC',
]);
//
//r.register('/ethercat/CNC/Exhaust', 'multiply', '/ethercat/CNC/Exhaust_current', '/ethercat/CNC/Global_voltage');
//register('/CNC/Individualiser', 'console', '/CNC/Individualiser');

//r.register('/ethercat/CNC/Spindle', 'mean', '/ethercat/CNC/Spindle_Mean');
//r.register('/ethercat/CNC/Spindle_Mean', 'console', '/ethercat/CNC/Spindle_Mean');

//r.register("/AC/Energie_P1", "mean", "/Energie_P1");
//r.connect("/ethercat/Shunt/Wert_1", "/Energie_P1");
//r.register("/Energie_P1", "console", "P1");
//r.connect("/Energie_P1", "/mysql/DistributionB/Individualiser");

