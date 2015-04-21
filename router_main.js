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
require('./router_random_in.js').init(r, "/ethercat/Engel/Energie_P1", 20, 0, 100);

require('./router_io_mean.js').init(r);
//require('./router_childprocess.js').init(r, "/ethercat", "../ethercat_bridge/main", ["../ethercat_bridge/config.csv"]);


r.route('/ethercat/Klemme_1/Wert_2', 0, 230);

r.register('/ethercat/Klemme_1/Wert_1', function(id, name, time, v) {
	var node = r.get('/ethercat/Klemme_1/Wert_2');
	if (node.hasOwnProperty("value") && node.value !== null) {
		v *= 1000;
		v *= node.value;
		r.route('/Geraet_2/Energie', time, v);
	}
});

r.register("/ethercat/Engel/Energie_P1", r.dests.mean, "/Energie_P1");
r.register("/Energie_P1", r.dests.console, "P1");

