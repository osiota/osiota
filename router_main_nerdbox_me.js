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

require('./router_io_accumulate.js').init(r);
require('./router_io_eventdetection.js').init(r);

require('./router_device_virtual.js').init(r, {
	'/virtual/Mitbewohner': {
		'filename': 'energy_Mitbewohner.csv',
		'interval': 5
	},
	'/virtual/Heizungspumpe': {
		'filename': 'energy_Heizungspumpe.csv',
		'interval': 1
	}
});

// Wohnung
r.register('/wohnung/Küche', 'sum', '/wohnung', [
		'/wohnung/Flur',
		'/wohnung/Büro',
		'/wohnung/Mitbewohner'
]);

// Flur
r.register('/virtual/Heizungspumpe', 'sum', '/sum/Flur', []);
r.register('/sum/Flur', 'accumulate', '/wohnung/Flur');

r.register('/virtual/Heizungspumpe', 'eventdetection', '/wohnung/Flur/Heizungspumpe', {
	25: "Pumpt"
});

// Büro
r.register('/rsp-r320/Büro/Kopierer', 'sum', '/wohnung/Büro/SUM', [
		'/rsp-r320/Büro/Rest'
]);
r.register('/wohnung/Büro/SUM', 'accumulate', '/wohnung/Büro');


// Mitbewohner
r.register('/virtual/Mitbewohner', 'sum', '/wohnung/Mitbewohner/SUM', []);
r.register('/virtual/Mitbewohner', 'accumulate', '/wohnung/Mitbewohner');


// Kühe
r.register('/rsp-2a/Küche/Kühlschrank', 'sum', '/sum/Küche', [
		'/rsp-2a/Küche/Kaffeevollautomat',
		'/rsp-2a/Küche/Kaffeemaschine',
		'/rsp-2a/Küche/Microwelle',
		'/rsp-2a/Küche/Warmwasserboiler',
		'/rsp-2a/Küche/Wasserkocher',
		'/rsp-2a/Küche/Geschirrspüler'
]);
r.register('/sum/Küche', 'accumulate', '/wohnung/Küche');

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




