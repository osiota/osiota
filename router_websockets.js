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

	WebSocket.prototype.sendjson_save = function(data) {
		try {
			if (!this.closed) {
				var cache = [];
				var j = JSON.stringify(data, function(key, value) {
					if (key === 'obj') {
						return;
					}
					if (typeof value === 'object' && value !== null) {
						if (cache.indexOf(value) !== -1) {
							// Circular reference found, discard key
							return;
						}
						// Store value in our collection
						cache.push(value);
					}
					return value;
				});
				cache = null; // Enable garbage collection
				this.send(j);
			}
		} catch (e) {
			console.log("Websoket, sendjson_save: Exception: " + e);
		}
	};

	var WebSocketServer = WebSocket.Server;
	var wss = new WebSocketServer({port: port});

	wss.on('connection', function(ws) {
		ws.closed = false;

		ws.on('message', function(message) {
			//console.log('received: %s', message);
			try {
				var data = JSON.parse(message);
				router.process_message(basename, data, "wss", ws, function(data) { ws.respond(data); }, ws);
			} catch (e) {
				console.log("WebSocket, on message, Exception: ", e, e.stack.split("\n"));
				console.log("\tMessage: ", message);
			}
		});
		ws.on('error', function() {
			ws.emit('close');
		});

		require('./router_websocket_general.js').init(router, ws, "wss");
	});

	router.dests.wss = function(node, relative_name, do_not_add_to_history) {
		this.obj.node_rpc(this.id + relative_name, "data", node.time, node.value, false, do_not_add_to_history);
	};

};
