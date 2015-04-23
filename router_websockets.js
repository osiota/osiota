var WebSocket = require('ws');

exports.init = function(router, basename, port) {

	WebSocket.prototype.sendjson = function(data) {
		if (!this.closed)
			this.send(JSON.stringify(data));
	};

	var WebSocketServer = WebSocket.Server;
	var wss = new WebSocketServer({port: port});

	wss.on('connection', function(ws) {
		ws.closed = false;
		ws.send_data = function(id, name, time, value) {
			ws.sendjson({"type":"data", "id":id, "name":name, "time":time, "value":value});
		};
		ws.registered_nodes = [];
		ws.on('message', function(message) {
			console.log('received: %s', message);
			try {
				var mdata = JSON.parse(message);
				if (mdata.hasOwnProperty('type')) {
					if (mdata.type == 'register' && mdata.hasOwnProperty('node')) {
						var ref = router.register(mdata.node, {"to": ws.send_data, "id": mdata.node, "obj": ws});
						ws.registered_nodes.push({"node": mdata.node, "ref": ref});
					} else if (mdata.type == 'list') {
						ws.sendjson({"type":"dataset", "data":router.get_nodes()});
					} else if (mdata.type == 'data' && mdata.hasOwnProperty('node') &&
							mdata.hasOwnProperty('value') &&
							mdata.hasOwnProperty('time')) {
						router.route(basename + mdata.node, mdata.time, mdata.value);
					} else {
						console.log("Unknown type");
					}
				}
			} catch (e) {
				console.log("Exception: " + e);
			}
		});
		ws.on('close', function() {
			ws.closed = true;
			for(var i=0; i<ws.registered_nodes.length; i++) {
				router.unregister(ws.registered_nodes[i].node, ws.registered_nodes[i].ref);
			}
			ws.registered_nodes = null;
		});
	});

};
