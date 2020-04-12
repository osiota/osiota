var WebSocket = require('ws');

exports.init = function(router, basename, options) {

	if (typeof options !== "object" || options === null) {
		options = { port: options };
	}

	WebSocket.prototype.sendjson = function(data) {
		try {
			if (!this.closed &&
					this.readyState == 1) {
				this.send(JSON.stringify(data));
			}
		} catch (e) {
			console.log("Websocket, sendjson: Exception:",
					e.stack || e);
		}
	};

	var WebSocketServer = WebSocket.Server;
	var wss = new WebSocketServer(options);
	wss.wpath = ":";
	if (typeof options.port === "number") {
		wss.wpath = ':'+options.port.toString();
	}

	wss.on('connection', function(ws, req) {
		ws.closed = false;
		ws.basename = basename;
		ws.wpath = wss.wpath;

		// check if connection is allowed:
		try {
			// throw an error if not allowed:
			router.emit("connection", "ws", ws, req);
		} catch (err) {
			ws.sendjson({"type": "error", "args": [
				err.message, (err.stack || err).toString()
			]});

			// do not add any event handlers:
			return;
		}

		ws.keepalive = function(ping_interval) {
			ws._keepalive = setInterval(function() {
				if (ws.is_alive === false) {
					console.error("WebSocketServer Error: "+
						"Got no keepalive in interval."+
						" Terminating connection.");
					ws.end_keepalive();
					return ws.terminate();
				}

				ws.is_alive = false;
				ws.ping();
			}, ping_interval);
		};
		ws.end_keepalive = function() {
			clearInterval(ws._keepalive);
			ws._keepalive = null;
		};
		ws.on("pong", function(data) {
			ws.is_alive = true;
		});
		ws.keepalive(55*1000);

		ws.on('message', function(message) {
			//console.log('received: %s', message);
			try {
				var data = JSON.parse(message);
				router.process_message(basename, data,
						ws.respond.bind(ws), ws);
			} catch (e) {
				console.log("WebSocket, on message, Exception:",
						e, e.stack.split("\n"));
				console.log("\tMessage: ", message);
			}
		});
		ws.on('error', function(err) {
			console.log("WebSocket Connection error",
				err.stack || err);
		});
		/* unregister on close: */
		ws.on('close', function(code, message) {
			ws.end_keepalive();
			if (!ws.closed) {
				ws.closed = true;
			}
		});

		// TODO login: move to: post login
		require('./router_websocket_generic.js').init(router, ws);
	});

	return wss;
};
