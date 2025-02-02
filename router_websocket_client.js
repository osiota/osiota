const EventEmitter = require('events').EventEmitter;

let WebSocket;
if (typeof window !== 'undefined') {
	WebSocket = window.WebSocket || window.MozWebSocket;
} else {
	WebSocket = require('ws');
}

// persistent websocket client:
class pwsc extends EventEmitter {
	constructor(wpath) {
		super();
		this.wpath = wpath;

		this.closed = true;
		this.freezed = false;
		this._destroy = false;
		this._reconnect_delay = 1000;

		this.tid = null;
		this.on('need_reconnect', (timeout)=>{
			if (typeof timeout !== "number") {
				timeout = Math.min(this._reconnect_delay, 10000);
				this._reconnect_delay *= 1.5;
			}
			this.ws = undefined;

			if (this.tid) {
				clearTimeout(this.tid);
				this.tid = null;
			}

			if (!this.closed) {
				this.closed = true;
				if (!this.freezed)
					this.emit("close");
			}
			if (this._destroy) {
				return;
			}

			this.tid = setTimeout(()=>{
				console.log("need reconnect -> timeout");
				this.init();
			}, timeout);
		});

		this.init();
	};

	init() {
		const pthis = this;
		try {
			if (typeof document !== "undefined" &&
					typeof document.hidden !== "undefined" &&
					typeof document.addEventListener
							!== "undefined" &&
					document.hidden) {
				console.log("document.hidden");

				document.addEventListener("visibilitychange",
						function cb() {
					document.removeEventListener(
							"visibilitychange", cb);
					console.log("document.show");
					pthis.init();
				}, false);

				return;
			}
			console.log("BasicWebSocket connecting", this.wpath);
			this.ws = new WebSocket(this.wpath);
			this.ws.reconnect = false;
			// Browser WebSocket is not an EventEmitter. So define
			// on and emit:
			if (!this.ws.on) {
				this.ws.on = function(type, callback) {
					this["on" + type] = callback;
				};
			}
			if (!this.ws.emit) {
				this.ws.emit = function(type) {
					this["on" + type].call(this);
				};
			}
			this.ws.keepalive = function(ping_interval) {
				const _ws = this;
				this._keepalive = setInterval(function() {
					if (_ws.is_alive === false) {
						_ws.end_keepalive();
						console.error("WebSocket Error: Got "+
							"no keepalive in interval. "+
							"Terminating connection.");
						return _ws.terminate();
					}

					_ws.is_alive = false;
					if (_ws.ping) {
						_ws.ping();
					} else {
						_ws.rpc("ping", function(err) {
							if (!err) {
								_ws.is_alive = true;
							}
						});
					}
				}, ping_interval);
			};
			this.ws.end_keepalive = function() {
				clearInterval(this._keepalive);
				this._keepalive = null;
			};
			this.ws.on("pong", function(data) {
				this.is_alive = true;
			});
			this.ws.on('open', function() {
				pthis.closed = false;
				pthis._reconnect_delay = 1000;
				pthis.emit('open');
				this.keepalive(55*1000);
			});
			this.ws.on('message', function(message) {
				pthis.recvjson(message);
			});
			this.ws.on('close', function(code, message) {
				console.log("BasicWebSocket closing", pthis.remote,
					"code", code, "message", message,
					"reconnect", this.reconnect);
				this.end_keepalive();
				/* try to reconnect: Use  */
				if (!this.reconnect) {
					this.reconnect = true;
					pthis.emit("need_reconnect");
				}
			});
			this.ws.on('error', function(err) {
				console.log("bWSc: Error:", err.stack || err);
				this.end_keepalive();
				if (!this.reconnect) {
					this.reconnect = true;
					pthis.emit("need_reconnect");
				}
			});

		} catch(e) {
			console.log("bWSc: Exception while creating socket:",
					e.stack || e);
			this.ws = undefined;
			if (e.name == "SecurityError" && e.message ==
					"The operation is insecure.") {
				if (typeof alert == "function") {
					alert("Can not downgrade SSL connection. "+
						"Use WebSocket over SSL: wss://");
				} else {
					console.warn("Can not downgrade SSL "+
						"connection. Use WebSocket "+
						"over SSL: wss://");
				}
			} else {
				pthis.emit("need_reconnect", 5000);
			}
		}
	};
	sendjson_raw(message) {
		//console.log("send:", message);
		this.ws.send(message);
	};
	sendjson(data) {
		try {
			if (!this.closed &&
					typeof this.ws !== "undefined" &&
					this.ws.readyState == 1) {
				this.sendjson_raw(JSON.stringify(data));
			}
		} catch (e) {
			console.log("bWSc: Socket not connected. Exception (send):",
					e.stack || e);
		}
	};
	recvjson(message) {
		//console.log('received:', message);
		try {
			// Browser WebSocket sends an event
			// with message in field data:
			if (typeof message === "object" && message.data)
				message = message.data;

			const data = JSON.parse(message);
			this.emit('message', data);
		} catch(e) {
			console.log("bWSc: Exception (on message):",
					e.stack || e);
			console.log("message:", message);
		}
	};
	close() {
		this._destroy = true;
		if (this.tid) {
			clearTimeout(this.tid);
			this.tid = null;
		}
		if (!this.closed &&
				typeof this.ws !== "undefined") {
			console.log("closing websocket to:", this.remote);
			this.ws.close();
		}
	};
	reconnect(wpath) {
		if (typeof wpath === "string") {
			this.wpath = wpath;
		}
		if (this._destroy) {
			this._destroy = false;
			return this.init();
		}
		if (!this.closed &&
				typeof this.ws !== "undefined") {
			this.ws.close();
		}
	};
};

// Usage: init(r, "", 'ws://localhost:8080/');

exports.init = function(main, rpcstack, basename, ws_url, init_callback) {
	const router = main.router;
	const ws = new pwsc(ws_url);
	ws.basename = basename;

	ws.on("message", function(data) {
		rpcstack.process_message(data, ws.respond.bind(ws), ws);
	});

	require('./router_websocket_generic.js').init(router, rpcstack, ws);

	ws.on("open", function() {
		this.rpc("hello", router.name, function(error, name) {
			// this = ws
			if (error) throw error;

			if (typeof name === "string")
				ws.remote = name;
			console.log("Connected to", ws.remote);

			// TODO login: -> emit open
		});

		if (typeof init_callback === "function")
			init_callback(ws);
	});

	if (typeof window !== "undefined" &&
			typeof window.addEventListener !== "undefined") {
		window.addEventListener("beforeunload", function (event) {
			ws.freezed = true;
			ws.close();
		});
	}

	return ws;
};

exports.pWebSocket = pwsc;
