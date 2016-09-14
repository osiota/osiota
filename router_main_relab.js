#!/usr/bin/node

var mysql_config = require("./router_main_relab_config.js").mysql_config;

var Router = require('./router.js').router;
var r = new Router("IWF Forschungsfabrik");

require('./module_history.js').init(r, 'ram');

require('./router_mysql.js').init(r, "/mysql", mysql_config);
require('./router_console_out.js').init(r, "/console");
require('./router_websockets.js').init(r, "", 8080);
require('./router_console_in.js').init(r, "");
require('./router_childprocess.js').init(r, "", "../energy-router-ethercat/main", ["../energy-router-ethercat/config.csv"]);

require('./router_io_function.js').init(r);
require('./router_io_mean.js').init(r);
require('./router_io_bias.js').init(r);
require('./router_io_multiply.js').init(r);
require('./router_io_sum.js').init(r);

r.connectArray(
	require('./config_static_routes_relab.js').static_routes
);

require("./router_config_readdir.js").init(r, "/TUBS/IWF", "Struktur_Router/IWF/");

//r.register('/ethercat/CNC/Global_voltage', 'multiply', '/ethercat/CNC/Exhaust', '/ethercat/CNC/Exhaust_current');
r.register('/S40/P1', 'sum', '/S40/P', [
		'/S40/P2',
		'/S40/P2',
]);
r.node('/S40/P').connect('/TUBS/IWF/Forschungsfabrik/VB1 Metallbearbeitung/Studer S40/Energieverbrauch.energy.data');

r.register('/S120/P1', 'sum', '/S120/P', [
		'/S120/P2',
		'/S120/P2',
]);
r.node('/S120/P').connect('/TUBS/IWF/Forschungsfabrik/VB1 Metallbearbeitung/Studer S120/Energieverbrauch.energy.data');

r.register('/Engel/P1', 'sum', '/Engel/P', [
		'/Engel/P2',
		'/Engel/P3',
]);
r.node('/Engel/P').connect('/TUBS/IWF/Forschungsfabrik/VB1 Metallbearbeitung/Engel Victory 160/Energieverbrauch.energy.data');

r.register('/DMU/P1', 'sum', '/DMU/P', [
		'/DMU/P2',
		'/DMU/P3',
]);
r.node('/DMU/P').connect('/TUBS/IWF/Forschungsfabrik/VB1 Metallbearbeitung/DMU 100 MonoBLOCK/Energieverbrauch.energy.data');

r.register('/Spinner/P1', 'sum', '/Spinner/P', [
                '/Spinner/P2',
                '/Spinner/P3',
]);
r.node('/Spinner/P').connect('/TUBS/IWF/Forschungsfabrik/VB1 Metallbearbeitung/Spinner TC600/Energieverbrauch.energy.data');

r.node('/TUBS/IWF/Forschungsfabrik/VB1 Metallbearbeitung/Engel Victory 160/Energieverbrauch.energy.data').register('sum',
			'/TUBS/IWF/Forschungsfabrik/VB1 Metallbearbeitung/Energieverbrauch.energy.data', [
		'/TUBS/IWF/Forschungsfabrik/VB1 Metallbearbeitung/DMU 100 MonoBLOCK/Energieverbrauch.energy.data',
		'/TUBS/IWF/Forschungsfabrik/VB1 Metallbearbeitung/Spinner TC600/Energieverbrauch.energy.data',
		'/TUBS/IWF/Forschungsfabrik/VB1 Metallbearbeitung/Studer S120/Energieverbrauch.energy.data',
		'/TUBS/IWF/Forschungsfabrik/VB1 Metallbearbeitung/Studer S40/Energieverbrauch.energy.data'
]);

r.node('/TUBS/IWF/Forschungsfabrik/VB1 Metallbearbeitung/Energieverbrauch.energy.data').register('sum',
			'/TUBS/IWF/Forschungsfabrik/Energieverbrauch.energy.data', [
]);


r.register('/HQL/P1', 'sum', '/HQL/P', [
                '/HQL/P2',
                '/HQL/P3',
]);
r.node('/HQL/P').connect('/TUBS/IWF/TGA/Beleuchtung/HQ-Lampen/Energieverbrauch.energy.data');

r.register('/T8/P1', 'sum', '/T8/P', [
                '/T8/P2',
                '/T8/P3',
]);
r.node('/T8/P').connect('/TUBS/IWF/TGA/Beleuchtung/Leuchtstoffröhren/Energieverbrauch.energy.data');

r.node('/TUBS/IWF/TGA/Beleuchtung/Leuchtstoffröhren/Energieverbrauch.energy.data').register('sum',
			'/TUBS/IWF/TGA/Beleuchtung/Energieverbrauch.energy.data', [
		'/TUBS/IWF/TGA/Beleuchtung/HQ-Lampen/Energieverbrauch.energy.data'
]);

r.node('/TUBS/IWF/TGA/Beleuchtung/Energieverbrauch.energy.data').register('sum',
			'/TUBS/IWF/TGA/Energieverbrauch.energy.data', [
]);
r.node('/TUBS/IWF/TGA/Energieverbrauch.energy.data').register('sum',
			'/TUBS/IWF/Energieverbrauch.energy.data', [
		'/TUBS/IWF/Forschungsfabrik/Energieverbrauch.energy.data'
]);


require('./router_websocket_sendto.js').init(r, "ws://sw.nerdbox.de:8086/", ['/TUBS']);
