var WebSocket = require('ws');

exports.init = function(router, basename, port) {

	WebSocket.prototype.sendjson = function(data) {
		try {
			if (!this.closed)
				this.send(JSON.stringify(data));
		} catch (e) {
			console.log("Websocket, sendjson: Exception: " + e);
		}
	};

	var module_name = router.register_static_dest("wss", function(node, relative_name, do_not_add_to_history) {
		// this == rentry
		var ws = this.obj;
		if (typeof this.missed_data === "undefined") {
			this.missed_data = {};
			this.missed_data["n"+relative_name] = true;
		}
		if (typeof this.missed_data["n"+relative_name] === "undefined" || this.missed_data["n"+relative_name]) {
			this.missed_data["n"+relative_name] = false;
			ws.node_rpc(this.id + relative_name, "missed_data", node.time);
		}
		ws.node_rpc(this.id + relative_name, "data", node.time, node.value, false, do_not_add_to_history);
	});


	var WebSocketServer = WebSocket.Server;
	var wss = new WebSocketServer({port: port});

	wss.on('connection', function(ws) {
		ws.closed = false;
		ws.basename = basename;

		ws.on('message', function(message) {
			//console.log('received: %s', message);
			try {
				var data = JSON.parse(message);
				router.process_message(basename, data, module_name, ws, function(data) { ws.respond(data); }, ws);
			} catch (e) {
				console.log("WebSocket, on message, Exception: ", e, e.stack.split("\n"));
				console.log("\tMessage: ", message);
			}
		});
		ws.on('error', function() {
		});
		/* unregister on close: */
		ws.on('close', function() {
			if (!ws.closed) {
				ws.closed = true;
			}
		});

		require('./router_websocket_generic.js').init(router, ws, module_name);
	});

	return wss;
};
