#!/usr/bin/node

var mysql_config = require("./router_main_relab_config.js").mysql_config;

var Router = require('./router.js').router;
var r = new Router("IWF Forschungsfabrik");

require('./router_mysql.js').init(r, "/mysql", mysql_config);
require('./router_console_out.js').init(r, "/console");
require('./router_websockets.js').init(r, "", 8080);
require('./router_console_in.js').init(r, "");
require('./router_childprocess.js').init(r, "/ethercat", "../energy-router-ethercat/main", ["../energy-router-ethercat/config.csv"]);

require('./router_io_function.js').init(r);
require('./router_io_mean.js').init(r);
require('./router_io_bias.js').init(r);
require('./router_io_multiply.js').init(r);
require('./router_io_sum.js').init(r);

r.connectArray(
	require('./config_static_routes_relab.js').static_routes
);

//r.register('/ethercat/CNC/Global_voltage', 'multiply', '/ethercat/CNC/Exhaust', '/ethercat/CNC/Exhaust_current');
r.register('/ethercat/S40/P_L1', 'sum', '/S40/P', [
		'/ethercat/S40/P_L2',
		'/ethercat/S40/P_L2',
]);
r.register('/ethercat/Engel/P_L1', 'sum', '/Engel/P', [
		'/ethercat/Engel/P_L2',
		'/ethercat/Engel/P_L3',
]);

r.register('/ethercat/DMU/P_L1', 'sum', '/DMU/P', [
		'/ethercat/DMU/P_L2',
		'/ethercat/DMU/P_L3',
]);
