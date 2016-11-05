/* Helper file to combine the router into one bundle file via webpack */

var Router = require('./router.js').router;
var r = new Router("WebClient");

require('./module_history.js').init(r, 'ram', {
	"maxCount": 3000
});

require('./router_io_function.js').init(r);
require('./router_io_mean.js').init(r);
require('./router_io_bias.js').init(r);
require('./router_io_multiply.js').init(r);
require('./router_io_sum.js').init(r);

//require('./router_console_out.js').init(r, "/");

//require('./router_random_in.js').init(r, "/random", 20, 0, 100);
require('./router_test.js').init(r, "/test", 100);

r.localStorage = require('./router_localStorage.js').init.bind(r, r);
r.websocket_client = require('./router_websocket_client.js').init.bind(r, r);

module.exports = r;

