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
		ws.remote = "";
		ws.respond = router.cue(function(data) {
			ws.sendjson(data);
		});
		ws.registered_nodes = [];
		ws.rpc_node_bind = function(reply) {
			// this == node
			var ref = this.register("wss", this.name, ws);

			// inform bind:
			ws.registered_nodes.push({"node": this.name, "ref": ref});

			reply(null, "okay");
		};
		ws.rpc_node_unbind = function(reply) {
			// this == node
			for(var i=0; i<ws.registered_nodes.length; i++) {
				if (this.name === ws.registered_nodes[i].node) {
					var regnode = ws.registered_nodes.splice(i, 1);
					this.unregister(regnode.ref);
					reply(null, "okay");
				}
			}
			reply("unregister: node not registered", this.node);
		};
		ws.rpc_hello = function(name, reply) {
			if (typeof name === "string")
				ws.name = name;
			reply(null, router.name);
		};
		ws.rpc = function(method) {
			var args = Array.prototype.slice.call(arguments);
			var object = router._rpc_create_object.apply(router, args);
			ws.respond(object);
		};
		ws.node_rpc = function(node, method) {
			var args = Array.prototype.slice.call(arguments);
			//var node =
			args.shift();
			var object = router._rpc_create_object.apply(router, args);
			object.node = node;
			ws.respond(object);
		};

		ws.on('message', function(message) {
			//console.log('received: %s', message);
			try {
				var data = JSON.parse(message);
				router.process_message(basename, data, "wss", ws, function(data) { ws.respond(data); });
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

	router.dests.wss = function(node, relative_name, do_not_add_to_history) {
		this.obj.node_rpc(this.id + relative_name, "data", node.time, node.value, false, do_not_add_to_history);
	};


};
