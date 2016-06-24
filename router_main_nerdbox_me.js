#!/usr/bin/node

var Router = require('./router.js').router;
var r = new Router("Server, nerdbox: My Energy");

require('./module_history.js').init(r, 'ram');

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
r.eventdetection = require('./router_io_eventdetection.js').init.bind(r, r);
require('./router_io_eventdetection2.js').init(r);

r.random = require('./router_random_in.js').init.bind(r, r);

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
r.node('/wohnung/Küche').register('sum', '/wohnung', [
		'/wohnung/Flur',
		'/wohnung/Büro',
		'/wohnung/Bad',
		'/wohnung/Mitbewohner'
]);

// Flur
r.node('/virtual/Heizungspumpe').register('sum', '/sum/Flur', []);
r.node('/sum/Flur').register('accumulate', '/wohnung/Flur');

r.eventdetection( r.node('/virtual/Heizungspumpe'), '/wohnung/Flur/Heizungspumpe', {
	25: "Pumpt"
});

// Bad
r.node('/virtual/Föhn').register('sum', '/sum/Bad', []);
r.node('/sum/Bad').register('accumulate', '/wohnung/Bad');
r.eventdetection( r.node('/virtual/Föhn'), '/wohnung/Bad/Föhn', {
	1000: "Föhnt"
});


// Büro
r.node('/rsp-r320/Büro/Kopierer').register('sum', '/wohnung/Büro/SUM', [
		'/rsp-r320/Büro/Rest'
]);
r.node('/wohnung/Büro/SUM').register('accumulate', '/wohnung/Büro');


// Mitbewohner
r.node('/virtual/Mitbewohner').register('sum', '/wohnung/Mitbewohner/SUM', []);
r.node('/virtual/Mitbewohner').register('accumulate', '/wohnung/Mitbewohner');


// Kühe
r.node('/rsp-2a/Küche/Kühlschrank').register('sum', '/sum/Küche', [
		'/rsp-2a/Küche/Kaffeevollautomat',
//		'/rsp-2a/Küche/Kaffeemaschine',
		'/rsp-2a/Küche/Herd',
		'/rsp-2a/Küche/Microwelle',
		'/rsp-2a/Küche/Warmwasserboiler',
		'/rsp-2a/Küche/Wasserkocher',
		'/rsp-2a/Küche/Geschirrspüler'
]);
r.node('/sum/Küche').register('accumulate', '/wohnung/Küche');

r.eventdetection( r.node('/rsp-2a/Küche/Wasserkocher'), '/wohnung/Küche/Wasserkocher', {
	1000: "An"
});
r.eventdetection( r.node('/rsp-2a/Küche/Warmwasserboiler'), '/wohnung/Küche/Warmwasserboiler', {
	1000: "An"
});
r.eventdetection( r.node('/rsp-2a/Küche/Microwelle'), '/wohnung/Küche/Microwelle', {
	38: "An"
});
r.eventdetection( r.node('/rsp-2a/Küche/Geschirrspüler'), '/wohnung/Küche/Geschirrspüler', {
	1000: "An"
});
/*
r.node('/rsp-2a/Küche/Kaffeemaschine').register('eventdetection', '/wohnung/Küche/Kaffeemaschine', {
	30: "Kaffee kochen"
});
*/
r.node('/rsp-2a/Küche/Kaffeevollautomat').register('eventdetection2', '/wohnung/Küche/Kaffeevollautomat', {
	25: "Heizt"
});
r.eventdetection( r.node('/rsp-2a/Küche/Kühlschrank'), '/wohnung/Küche/Kühlschrank', {
	80: "Kühlt"
});
r.eventdetection( r.node('/rsp-2a/Küche/Herd'), '/wohnung/Küche/Herd', {
	100: "Heizt"
});


r.dests.reaktion_foehn = function(node, relative_name) {
	if (typeof node.value === "string") {
		var rdata = JSON.parse(node.value);
		if (!rdata.running) {
			setTimeout(function() {
				r.play_device('/virtual/Föhn', {
					filename: 'foehn.csv',
					repeats: 1,
					interval: 1
				});
			}, 2000);
		}
	}
};

r.node('/wohnung/Küche/Herd').register('reaktion_foehn');

require("./router_config_readdir.js").init(r, "/TUBS", "Struktur_Router/");

r.node('/TUBS/IfN/Energieverbrauch.energy.data').register('sum',
			'/TUBS/Energieverbrauch.energy.data', [ ]);

r.node('/TUBS/IfN/Teeküche/Energieverbrauch.energy.data').register('sum',
			'/TUBS/IfN/Energieverbrauch.energy.data', [ ]);

r.node('/TUBS/IfN/Teeküche/Geschirrspüler/Energieverbrauch.energy.data').register('sum',
			'/TUBS/IfN/Teeküche/Energieverbrauch.energy.data', [
		'/TUBS/IfN/Teeküche/Herd/Energieverbrauch.energy.data',
		'/TUBS/IfN/Teeküche/Kaffeevollautomat/Energieverbrauch.energy.data',
		'/TUBS/IfN/Teeküche/Kühlschrank/Energieverbrauch.energy.data',
		'/TUBS/IfN/Teeküche/Mikrowelle/Energieverbrauch.energy.data',
		'/TUBS/IfN/Teeküche/Warmwasserboiler/Energieverbrauch.energy.data',
		'/TUBS/IfN/Teeküche/Wasserkocher/Energieverbrauch.energy.data'
]);


r.node('/rsp-2a/Küche/Wasserkocher').connect('/TUBS/IfN/Teeküche/Wasserkocher/Energieverbrauch.energy.data');
r.node('/rsp-2a/Küche/Warmwasserboiler').connect('/TUBS/IfN/Teeküche/Warmwasserboiler/Energieverbrauch.energy.data');
r.node('/rsp-2a/Küche/Microwelle').connect('/TUBS/IfN/Teeküche/Mikrowelle/Energieverbrauch.energy.data');
r.node('/rsp-2a/Küche/Geschirrspüler').connect('/TUBS/IfN/Teeküche/Geschirrspüler/Energieverbrauch.energy.data');
r.node('/rsp-2a/Küche/Kaffeevollautomat').connect('/TUBS/IfN/Teeküche/Kaffeevollautomat/Energieverbrauch.energy.data');
r.node('/rsp-2a/Küche/Kühlschrank').connect('/TUBS/IfN/Teeküche/Kühlschrank/Energieverbrauch.energy.data');
r.node('/rsp-2a/Küche/Herd').connect('/TUBS/IfN/Teeküche/Herd/Energieverbrauch.energy.data');

r.node('/wohnung/Küche/Wasserkocher').connect('/TUBS/IfN/Teeküche/Wasserkocher/Status.status');
r.node('/wohnung/Küche/Warmwasserboiler').connect('/TUBS/IfN/Teeküche/Warmwasserboiler/Status.status');
r.node('/wohnung/Küche/Microwelle').connect('/TUBS/IfN/Teeküche/Mikrowelle/Status.status');
r.node('/wohnung/Küche/Geschirrspüler').connect('/TUBS/IfN/Teeküche/Geschirrspüler/Status.status');
r.node('/wohnung/Küche/Kaffeevollautomat').connect('/TUBS/IfN/Teeküche/Kaffeevollautomat/Status.status');
r.node('/wohnung/Küche/Kühlschrank').connect('/TUBS/IfN/Teeküche/Kühlschrank/Status.status');
r.node('/wohnung/Küche/Herd').connect('/TUBS/IfN/Teeküche/Herd/Status.status');


r.random("/TUBS/IfN/Teeküche/Helligkeit.light.data", 10*1000, 0, 100, 20, 0);
r.random("/TUBS/IfN/Teeküche/Temperatur.temperature.data", 10*1000, 20, 22, 20, 1);
r.random("/TUBS/IfN/Teeküche/Kaffeevollautomat/Temperatur-Heizstäbe.temperature.data", 1000, 30, 120, 5, 1);
r.random("/TUBS/IfN/Teeküche/Warmwasserboiler/Temperatur.temperature.data", 1000, 22, 80, 5, 1);
r.random("/TUBS/IfN/Teeküche/Wasserkocher/Temperatur.temperature.data", 1000, 22, 100, 5, 1);

r.rpc_node_analyse_add = function(reply, type, name, settings) {
	var node = this;

	require("./analysen/" + type.replace(/[^A-Za-z0-9_]/g, '') + ".js").init(r, node, name, settings);

	reply(null, "ok");
};
