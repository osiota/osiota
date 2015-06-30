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
		ws.send_data = function(id, time, value) {
			ws.sendjson({"type":"data", "node":id, "time":time, "value":value});
		};
		ws.registered_nodes = [];
		ws.on('message', function(message) {
			//console.log('received: %s', message);
			try {
				var mdata = JSON.parse(message);
				if (mdata.hasOwnProperty('type')) {
					if (mdata.type == 'bind' && mdata.hasOwnProperty('node')) {
						var ref = router.register(mdata.node, "wss", mdata.node, ws);
						ws.registered_nodes.push({"node": mdata.node, "ref": ref});
					} else if (mdata.type == 'list') {
						ws.sendjson_save({"type":"dataset", "data":router.get_nodes()});
					} else if (mdata.type == 'data' && mdata.hasOwnProperty('node') &&
							mdata.hasOwnProperty('value') &&
							mdata.hasOwnProperty('time')) {
						router.route(basename + mdata.node, mdata.time, mdata.value);
					} else if (mdata.type == 'connect' && mdata.hasOwnProperty('node') &&
							mdata.hasOwnProperty('dnode')) {
						router.connect(mdata.node, mdata.dnode);
					} else if (mdata.type == 'register' && mdata.hasOwnProperty('node') &&
							mdata.hasOwnProperty('dest')) {
						router.register(mdata.node, mdata.dest, mdata.id, mdata.obj);
					} else if (mdata.type == 'unregister' && mdata.hasOwnProperty('node') &&
							mdata.hasOwnProperty('rentry')) {
						router.unregister(mdata.node, mdata.rentry);
					} else if (mdata.type == 'get_dests') {
						ws.sendjson_save({"type":"dests", "data":router.get_dests()});
					} else {
						console.log("WebSocket: Packet with unknown type received: ", mdata.type,
							" Packet: ", JSON.stringify(mdata));
					}
				}
			} catch (e) {
				console.log("Exception: " + e);
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
		obj.send_data(id, time, value);
	};


};
