#!/usr/bin/node

var mysql_config = {
	host     : 'pul.iwf.ing.tu-bs.de',
	user     : 'exfab',
	password : 'PSprfU6DcMMChWYC',
	database : 'Experimentierfabrik'
};

var router = require('./router.js');

require('./router_mysql.js').init(router, "/mysql", mysql_config);
require('./router_console_out.js').init(router, "/console");
require('./router_websockets.js').init(router, "/ws", 8080);
require('./router_console_in.js').init(router, "/in);
//require('./router_childprocess.js').init(router, "/ethercat", "../ethercat_bridge/main", "");


router.route('/Klemme_1/Wert_2', 0, 230);

router.register('/Klemme_1/Wert_1', {"to": function(id, name, time, v) {
	if (router.data.hasOwnProperty('/Klemme_1/Wert_2')) {
		v *= 1000;
		v *= router.data['/Klemme_1/Wert_2'];
		router.route('/Geraet_2/Energie', time, v);
	}
}, "id": "-"});

router.register("/Klemme_1/Wert_1",
	{"to": exports.dests.console, "id": "Wert 1", "f": function(v) {return v * 1000; }}
);
router.register("/Engel/Energie_P1",
	{"to": exports.dests.console, "id": "P", "f": function(v) { return v * 1000; }}
);

