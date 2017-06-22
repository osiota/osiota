var WebSocket = require('ws');

exports.init = function(router, basename, port) {

	WebSocket.prototype.sendjson = function(data) {
		try {
			if (!this.closed &&
					this.readyState == 1) {
				this.send(JSON.stringify(data));
		} catch (e) {
			console.log("Websocket, sendjson: Exception:",
					e.stack || e);
		}
	};

	var WebSocketServer = WebSocket.Server;
	var wss = new WebSocketServer({port: port});
	wss.wpath = ':'+port.toString();

	wss.on('connection', function(ws) {
		ws.closed = false;
		ws.basename = basename;
		ws.wpath = wss.wpath;

		ws.on('message', function(message) {
			//console.log('received: %s', message);
			try {
				var data = JSON.parse(message);
				router.process_message(basename, data,
						ws, ws.respond.bind(ws), ws);
			} catch (e) {
				console.log("WebSocket, on message, Exception:",
						e, e.stack.split("\n"));
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

		require('./router_websocket_generic.js').init(router, ws);
	});

	return wss;
};
