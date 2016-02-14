/* Send nodes to an other server */

// Usage: init(r, "", 'ws://localhost:8080/', ['/node1']);
exports.init = function(router, ws_url, nodes) {
	// get the hostname:
	var os = require("os");
	var hostname = os.hostname();

	var ws = require('./router_websocket_client.js')
			.init(router, "/wsc", ws_url);

	console.log("WS Client Connected.");
	for (var ni=0; ni<nodes.length; ni++) {
		name = nodes[ni];
		console.log("# Rerouting '" + name + "' via WebSocket to '/" + hostname + name + "'");

		ws.local_bind(router.node(name), "/" + hostname + name);
	}
};

