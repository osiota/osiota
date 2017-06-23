/* Helper file to combine the router into one bundle file via webpack */

var Router = require('./router.js').router;
var r = new Router("WebClient");

// Load history module
var history_config = {
	"type": "global",
	"submodules": [{
		"type": "memory",
		"max_data": 3000
	},{
		"type": "remote"
	}]
};

require('./module_history_class_memory.js');
require('./module_history_class_remote.js');
require('./module_history.js').init(r, history_config);

//require('./router_console_out.js').init(r, "/");

//require('./router_random_in.js').init(r, "/random", 20, 0, 100);
//require('./router_test.js').init(r, "/test", 100);

r.localStorage = require('./er-app-local-storage.js').init;
r.websocket_client = require('./router_websocket_client.js').init.bind(r, r);

module.exports = r;

