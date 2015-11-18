#!/usr/bin/node

var Router = require('./router.js').router;
var r = new Router();

require('./router_console_out.js').init(r, "/console");
require('./router_websockets.js').init(r, "", 8081);

require('./router_io_function.js').init(r);
require('./router_io_mean.js').init(r);
require('./router_io_bias.js').init(r);
require('./router_io_multiply.js').init(r);
require('./router_io_sum.js').init(r);


require('./router_tocsvfile.js').init(r, '', {
	'/rsp-2a/Küche': 'csv/Küche'
});

r.register('/rsp-2a/Küche/Kühlschrank', 'sum', '/wohnung/Küche', [
		'/rsp-2a/Küche/Kaffeevollautomat',
		'/rsp-2a/Küche/Kaffeemaschine',
		'/rsp-2a/Küche/Microwelle',
		'/rsp-2a/Küche/Warmwasserboiler',
		'/rsp-2a/Küche/Wasserkocher',
		'/rsp-2a/Küche/Geschirrspüler'
]);

r.register('/wohnung/Küche', 'sum', '/wohnung', [
		'/wohnung/Küche'
]);


r.dests.eventdetection = function(node) {
	var schwellen = this.obj;

	if (!this.hasOwnProperty("eventdetection")) {
		this.eventdetection = {
			aktivitaet: ""
		};
	}

	var neue_aktivitaet = "";
	for (var schwelle in schwellen) {
		if (node.value > schwelle) {
			neue_aktivitaet = schwellen[schwelle];
		}
	}
	if (neue_aktivitaet != "") {
		if (this.eventdetection.aktivitaet == "") {
			this.eventdetection = {
				timestamp: node.time,
				time: node.time,
				duration_sec: 0,
				running: 1,
				program: neue_aktivitaet,
				energy: 0
			};
		};
		this.eventdetection.duration_sec = node.time - this.eventdetection.timestamp;
		this.eventdetection.energy += node.value;
		r.publish(this.id, node.time, JSON.stringify(this.eventdetection), false, true);
	} else {
		if (this.eventdetection.aktivitaet != "") {
			this.eventdetection.running = 0;
			r.publish(this.id, node.time, JSON.stringify(this.eventdetection));
			this.eventdetection = {
				aktivitaet: ""
			};
		}
	}
};

r.register('/rsp-2a/Küche/Wasserkocher', 'eventdetection', '/wohnung/Küche/Wasserkocher', {
	1000: "An"
});
r.register('/rsp-2a/Küche/Warmwasserboiler', 'eventdetection', '/wohnung/Küche/Warmwasserboiler', {
	1000: "An"
});
r.register('/rsp-2a/Küche/Microwelle', 'eventdetection', '/wohnung/Küche/Microwelle', {
	1000: "An"
});
r.register('/rsp-2a/Küche/Geschirrspüler', 'eventdetection', '/wohnung/Küche/Geschirrspüler', {
	1000: "An"
});


r.register('/rsp-2a/Küche/Kaffeemaschine', 'eventdetection', '/wohnung/Küche/Kaffeemaschine', {
	30: "Kaffee kochen"
});

r.register('/rsp-2a/Küche/Kaffeevollautomat', 'eventdetection', '/wohnung/Küche/Kaffeevollautomat', {
	750: "Heizt"
});
r.register('/rsp-2a/Küche/Kühlschrank', 'eventdetection', '/wohnung/Küche/Kühlschrank', {
	80: "Kühlt"
});

