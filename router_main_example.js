#!/usr/bin/node

var Router = require('./router.js').router;
var r = new Router();

require('./module_history.js').init(r, 'ram');

require('./router_console_out.js').init(r, "/console");
require('./router_websockets.js').init(r, "", 8080);

require('./router_io_function.js').init(r);
require('./router_io_mean.js').init(r);
require('./router_io_bias.js').init(r);
require('./router_io_multiply.js').init(r);
require('./router_io_sum.js').init(r);

require('./router_random_in.js').init(r, "/random", 20, 0, 100);
require('./router_test.js').init(r, "/test", 100);

