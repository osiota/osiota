#!/usr/bin/node

var Router = require('./router.js').router;
var r = new Router();

require('./router_jsonconnect.js').init(r, "http://localhost/energy/get_sensors.php");

require('./router_console_out.js').init(r, "/console");
require('./router_websockets.js').init(r, "/ws", 8080);
require('./router_console_in.js').init(r, "");
//require('./router_random_in.js').init(r, "/ethercat/Engel/Energie_P1", 20, 0, 100);
require('./router_childprocess.js').init(r, "/plugwise", "/home/pi/plugwise_bridge/scripts/plugwise_log.pl", ["/dev/ttyUSB0"]);

require('./router_io_function.js').init(r);
require('./router_io_mean.js').init(r);
require('./router_io_bias.js').init(r);
require('./router_io_multiply.js').init(r);
require('./router_io_sum.js').init(r);


// get the hostname:
var os = require("os");
var hostname = os.hostname();

// route all nodes to the WebSocketClient:
require('./router_websocket_client.js')
		.init(r, "/wsc", "ws://sw.nerdbox.de:8080/", function(o_ws) {
	console.log("WS Client Connected.");
	setTimeout(function(router) {
		var nodes = router.get_nodes();
		for (var name in nodes) {
			if (nodes.hasOwnProperty(name)) {
				if (!name.match(/^\/plugwise\//)) {
					console.log("# Rerouting '" + name + "' via WebSocket to '/" + hostname + name + "'");
					router.register(name, "wsc", "/" + hostname + name);
				}
			}
		}
		
	}, 5000, r);
});


