var WebSocket = require('ws');

exports.init = function(router, port) {

	WebSocket.prototype.sendjson = function(data) {
			this.send(JSON.stringify(data));
	};

	var WebSocketServer = WebSocket.Server;
	var wss = new WebSocketServer({port: port});

	wss.on('connection', function(ws) {
		ws.send_data = function(id, name, time, value) {
			ws.sendjson({"type":"data", "id":id, "name":name, "time":time, "value":value});
		};
		ws.registered_nodes = [];
		ws.on('message', function(message) {
			console.log('received: %s', message);
			try {
				var mdata = JSON.parse(message);
				if (mdata.hasOwnProperty('command')) {
					if (mdata.command == 'register' && mdata.hasOwnProperty('node')) {
						var ref = router.register(mdata.node, {"to": ws.send_data, "id": mdata.node, "obj": ws});
						ws.registered_nodes.push({"node": mdata.node, "ref": ref});
					} else if (mdata.command == 'list') {
						ws.sendjson({"type":"dataset", "data":router.data});
					} else {
						console.log("Unknown command");
					}
				}
			} catch (e) {
				console.log("Exception: " + e);
			}
		});
		ws.on('close', function() {
			for(var i=0; i<ws.registered_nodes.length; i++) {
				router.unregister(ws.registered_nodes[i].node, ws.registered_nodes[i].ref);
			}
		});
	});

};
