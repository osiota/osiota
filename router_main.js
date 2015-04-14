#!/usr/bin/node

var router = require('./router.js');

require('./router_websockets.js').init(router, 8080);
require('./router_console_in.js').init(router);
//require('./router_childprocess.js').init(router, "../ethercat_bridge/main", "");


router.route('/Klemme_1/Wert_2', 0, 230);

router.register('/Klemme_1/Wert_1', {"to": function(id, name, time, v) {
	if (router.data.hasOwnProperty('/Klemme_1/Wert_2')) {
		v *= 1000;
		v *= router.data['/Klemme_1/Wert_2'];
		router.route('/Geraet_2/Energie', time, v);
	}
}, "id": "-"});


