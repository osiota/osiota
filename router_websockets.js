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
		ws.respond = router.cue(function(data) {
			ws.sendjson(data);
		});
		ws.send_data = function(id, time, value) {
			ws.respond({"type":"data", "node":id, "time":time, "value":value});
		};
		ws.registered_nodes = [];
		ws.inform_bind = function(node, ref) {
			ws.registered_nodes.push({"node": node, "ref": ref});
		};
		ws.on('message', function(message) {
			//console.log('received: %s', message);
			try {
				var data = JSON.parse(message);
				router.process_message(data, "wss", ws, function(data) { ws.respond(data); });
			} catch (e) {
				console.log("WebSocket, on message, Exception: ", e, e.stack.split("\n"));
				console.log("\tMessage: ", message);
			}
		});
		ws.on('close', function() {
			ws.closed = true;
			if (ws.registered_nodes) {
				for(var i=0; i<ws.registered_nodes.length; i++) {
					router.unregister(ws.registered_nodes[i].node, ws.registered_nodes[i].ref);
				}
				ws.registered_nodes = null;
			}
		});
		ws.on('error', function() {
			ws.emit('close');
		});
	});

	router.dests.wss = function(id, time, value, name, obj) {
		obj.respond({"type":"data", "node":id, "time":time, "value":value});
	};


};
