#!/usr/bin/node

var Router = require('./router.js').router;
var r = new Router("Server, nerdbox");

require('./router_console_out.js').init(r, "/console");
require('./router_websockets.js').init(r, "", 8080);

require('./router_io_function.js').init(r);
require('./router_io_mean.js').init(r);
require('./router_io_bias.js').init(r);
require('./router_io_multiply.js').init(r);
require('./router_io_sum.js').init(r);

require('./router_tocsvfile.js').init(r, '', {
	'/rsp-r320/Raum_215': 'csv/Raum_215',
	'/pcenergy': 'csv/pcenergy'
});

