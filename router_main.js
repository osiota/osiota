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

r.register('/ethercat/Klemme_1/Wert_1', "multiply", '/Geraet_2/Energie', '/ethercat/Klemme_1/Wert_2');

//r.register("/AC/Energie_P1", "mean", "/Energie_P1");
//r.connect("/ethercat/Shunt/Wert_1", "/Energie_P1");
//r.register("/Energie_P1", "console", "P1");
//r.connect("/Energie_P1", "/mysql/DistributionB/Individualiser");

