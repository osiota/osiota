/* Send nodes to an other server */

// Usage: init(r, "", 'ws://localhost:8080/', ['/node1']);
exports.init = function(router, ws_url, nodes) {
	// get the hostname:
	var os = require("os");
	var hostname = os.hostname();

	/*
	// better:
	router.dests.wsc_sendto = function(id, time, value, name, obj) {};
	*/

	return require('./router_websocket_client.js')
			.init(router, "/wsc", ws_url, function(o_ws) {
		console.log("WS Client Connected.");
		for (var ni=0; ni<nodes.length; ni++) {
			name = nodes[ni];
			console.log("# Rerouting '" + name + "' via WebSocket to '/" + hostname + name + "'");
			router.register(name, "wsc", "/" + hostname + name);

			/*
			// better:
			router.dests.wsc_sendto = function(id, time, value, name, obj) {
				o_ws.send_data(name, time, value);
			};
			*/

		}

	});



};

