var EventEmitter = require('events').EventEmitter;
var util = require('util');

var WebSocket;
if (typeof window !== 'undefined') {
	WebSocket = window.WebSocket || window.MozWebSocket;
} else {
	WebSocket = require('ws');
}

// persistent websocket client:
var pwsc = function(wpath) {
	EventEmitter.call(this);

	this.wpath = wpath;

	this.closed = true;
	this._destroy = false;

	this.on('need_reconnect', function() {
		this.ws = undefined;

		if (!this.closed) {
			this.closed = true;
			this.emit("close");
		}
		if (this._destroy) {
			return;
		}

		var pthis = this;
		setTimeout(function() { pthis.init(); }, 1000);
	});

	this.init();
};
util.inherits(pwsc, EventEmitter);

pwsc.prototype.init = function() {
	var pthis = this;
	try {
		this.ws = new WebSocket(this.wpath);
		this.ws.reconnect = false;
		// Browser WebSocket is not an EventEmitter. So define on and emit:
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
		this.ws.on('open', function() {
			pthis.closed = false;
			pthis.emit('open');
		});
		this.ws.on('message', function(message) {
			//console.log('received:', message);
			try {
				// Browser WebSocket sends an event with message in field data:
				if (typeof message === "object" && message.data)
					message = message.data;

				var data = JSON.parse(message);
				pthis.emit('message', data);
			} catch(e) {
				console.log("bWSc: Exception (on message):",
						e.stack || e);
				console.log("message:", message);
			}
		});
		this.ws.on('close', function() {
			/* try to reconnect: Use  */
			if (!this.reconnect) {
				this.reconnect = true;
				pthis.emit("need_reconnect");
			}
		});
		this.ws.on('error', function() {
			if (!this.reconnect) {
				this.reconnect = true;
				pthis.emit("need_reconnect");
			}
		});

	} catch(e) {
		console.log("bWSc: Exception while creating socket:",
				e.stack || e);
		this.ws = undefined;
		if (e.name == "SecurityError" && e.message == "The operation is insecure.") {
			if (typeof alert == "function") {
				alert("Can not downgrade SSL connection. Use WebSocket over SSL: wss://");
			} else {
				console.warn("Can not downgrade SSL connection. Use WebSocket over SSL: wss://");
			}
		} else {
			setTimeout(function() { pthis.init(); }, 3000);
		}
	}
};
pwsc.prototype.sendjson = function(data) {
	try {
		if (!this.closed &&
				typeof this.ws !== "undefined" &&
				this.ws.readyState == 1) {
			//console.log("send:", JSON.stringify(data));
			this.ws.send(JSON.stringify(data));
		}
	} catch (e) {
		console.log("bWSc: Socket not connected. Exception (send):",
				e.stack || e);
	}
};
pwsc.prototype.close = function() {
	this._destroy = true;
	if (!this.closed &&
			typeof this.ws !== "undefined") {
		this.ws.close();
	}
};
pwsc.prototype.reconnect = function(wpath) {
	this._destroy = false;
	if (typeof wpath === "string") {
		this.wpath = wpath;
	}
	if (!this.closed &&
			typeof this.ws !== "undefined") {
		this.ws.close();
	}
};


// Usage: init(r, "", 'ws://localhost:8080/');

exports.init = function(router, basename, ws_url, init_callback) {
	var ws = new pwsc(ws_url);
	ws.basename = basename;
	ws.module_name = router.register_static_dest("wsc", function(node, relative_name, do_not_add_to_history) {
		if (typeof this.missed_data === "undefined") {
			this.missed_data = {};
			this.missed_data["n"+relative_name] = true;
		}
		// this = rentry
		if (ws.closed) {
			if (!do_not_add_to_history) {
				this.missed_data["n"+relative_name] = true;
			}
		} else {
			if (typeof this.missed_data["n"+relative_name] === "undefined" || this.missed_data["n"+relative_name]) {
				this.missed_data["n"+relative_name] = false;
				ws.node_rpc(this.id + relative_name, "missed_data", node.time);
			}
			ws.node_rpc(this.id + relative_name, "data", node.time, node.value, false, do_not_add_to_history);
		}
	});

	ws.on("message", function(data) {
		router.process_message(basename, data, ws.module_name, ws, function(data) { ws.respond(data); }, ws);
	});

	require('./router_websocket_generic.js').init(router, ws, ws.module_name);
	
	ws.on("open", function() {
		this.rpc("hello", router.name, function(error, name) {
			if (error) throw error;

			if (typeof name === "string")
				ws.remote = name;
			console.log("Connected to", ws.remote);
		});

		if (typeof init_callback === "function")
			init_callback(ws);
	});

	return ws;
};

