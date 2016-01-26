#!/usr/bin/node

var Router = require('./router.js').router;
var r = new Router();

require('./module_history.js').init(r, 'levelup', {
	"maxCount": 3000,
	"databases": [
		{
			"delta_t": 0,
			"filename": "level_db_raw"
		},
		{
			"delta_t": 1,
			"filename": "level_db_sec"
		},
		{
			"delta_t": 60,
			"filename": "level_db_min"
		},
		{
			"delta_t": 60*60,
			"filename": "level_db_hour"
		}
	]
});

require('./router_console_out.js').init(r, "/console");
require('./router_websockets.js').init(r, "", 8080);

require('./router_io_function.js').init(r);
require('./router_io_mean.js').init(r);
require('./router_io_bias.js').init(r);
require('./router_io_multiply.js').init(r);
require('./router_io_sum.js').init(r);

require('./router_random_in.js').init(r, "/random", 20, 0, 100);
require('./router_test.js').init(r, "/test", 100);

