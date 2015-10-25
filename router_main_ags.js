#!/usr/bin/node

var Router = require('./router.js').router;
var r = new Router();

require('./router_console_out.js').init(r, "/console");
require('./router_websockets.js').init(r, "", 8080);
require('./router_console_in.js').init(r, "");
//require('./router_random_in.js').init(r, "/ethercat/Engel/Energie_P1", 20, 0, 100);
require('./router_agsbus.js').init(r, "/agsbus");

require('./router_artnet.js').init(r, "/artnet", {'host': 'dmxnode'}, {
	"/A-1": 1,
	"/D-3": 2,
	"/K-1": 3,
	"/B-1": 4,
	"/A-3": 5,
	"/E-1": 6,
	"/K-3": 7,
	"/H-1": 8,
	"/E-3": 9,
	"/D-1": 10,
	"/H-3": 11,
	"/B-3": 12,
	"/M-1": 13,
	"/C-1": 14,
	"/L-1": 15,
	"/F-1": 16,
	"/G-1": 17,
	"/C-3": 18,
	"/I-1": 19,
	"/F-3": 20,
	"/G-3": 21,
	"/M-3": 22,
	"/I-3": 23,
	"/L-3": 24
});

require('./router_io_function.js').init(r);
require('./router_io_mean.js').init(r);
require('./router_io_bias.js').init(r);
require('./router_io_multiply.js').init(r);
require('./router_io_sum.js').init(r);

require('./router_execcommand.js').init(r);


var static_routes = require('./config_static_routes_ags.js').static_routes;
for (var from in static_routes) {
	if (typeof static_routes[from] === "Array") {
		for (var tid=0; tid<static_routes[from].length; tid++) {
			r.connect(from, static_routes[from][tid]);
		}
	} else {
		r.connect(from, static_routes[from]);
	}
}

/*
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
		'/ethercat/Furnace/Heating',
		'/ethercat/Furnace/PLC',
]);

r.register('/ethercat/TransportB/Airflow', 'bias', '/ethercat/TransportB/Airflow_corrected');

r.register('/ethercat/CNC/PLC', 'sum', '/exlab/CNC', [
		'/ethercat/CNC/Spindle',
		'/ethercat/CNC/Position',
]);
*/

r.dests.not_if = function(id, time, value, name, obj) {
	if (typeof obj !== "object" || Object.prototype.toString.call(obj) !== '[object Array]') {
		obj = [obj];
	}

	for (var k=0;k<obj.length;k++) {
		var node2_name = obj[k];
		var node = r.get(node2_name, true);

		if (node.value !== null) {
			value *= !(1*node.value);
		}
	}
	r.route(id, time, value);
};

r.register('/ags/aktion/vordereingang', 'execcommand', '/home/max/intruder.sh');
r.register('/ags/sonstiges/vordereingang-bewegung', 'not_if',
	'/ags/aktion/vordereingang', [
		'/ags/tueren/stahltuer',
		'/ags/tueren/vordereingang'
	]);

r.register('/ags/sonstiges/klingeltaster', 'execcommand', '/home/max/klingeln.sh');
//
//r.register('/ethercat/CNC/Exhaust', 'multiply', '/ethercat/CNC/Exhaust_current', '/ethercat/CNC/Global_voltage');
//register('/CNC/Individualiser', 'console', '/CNC/Individualiser');

//r.register('/ethercat/CNC/Spindle', 'mean', '/ethercat/CNC/Spindle_Mean');
//r.register('/ethercat/CNC/Spindle_Mean', 'console', '/ethercat/CNC/Spindle_Mean');

//r.register("/AC/Energie_P1", "mean", "/Energie_P1");
//r.connect("/ethercat/Shunt/Wert_1", "/Energie_P1");
//r.register("/Energie_P1", "console", "P1");
//r.connect("/Energie_P1", "/mysql/DistributionB/Individualiser");

