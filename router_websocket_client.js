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
	this.reconnect = false;

	this.on('need_reconnect', function() {
		this.ws = undefined;

		this.emit("close");

		var pthis = this;
		setTimeout(function() { pthis.init(); }, 1000);
	});

	this.init();
};
util.inherits(pwsc, EventEmitter);

pwsc.prototype.init = function() {
	try {
		var pthis = this;
		this.ws = new WebSocket(this.wpath);
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
			try {
				// Browser WebSocket sends an event with message in field data:
				if (typeof message === "object" && message.data)
					message = message.data;

				var data = JSON.parse(message);
				pthis.emit('message', data);
			} catch(e) {
				console.log("bWSc: Exception (on message): ", e);
				console.log("message:", message);
			}
		});
		this.ws.on('close', function() {
			pthis.closed = true;
			/* try to reconnect: Use  */
			if (!pthis.reconnect) {
				pthis.reconnect = true;
				pthis.emit("need_reconnect");
			}
		});
		this.ws.on('error', function() {
			pthis.closed = true;
			if (!pthis.reconnect) {
				pthis.reconnect = true;
				pthis.emit("need_reconnect");
			}
		});

	} catch(e) {
		console.log("bWSc: Exception while creating socket: ", e);
		this.ws = undefined;
		setTimeout(function() { pthis.init(); }, 3000);
	}
};
pwsc.prototype.sendjson = function(data) {
	try {
		if (!this.closed &&
				typeof this.ws !== "undefined" &&
				this.ws.readyState == 1) {
			this.ws.send(JSON.stringify(data));
		}
	} catch (e) {
		console.log("bWSc: Socket not connected. Exception (send): " + e);
	}
};


// Usage: init(r, "", 'ws://localhost:8080/');

exports.init = function(router, basename, ws_url, init_callback) {
	var ws = new pwsc(ws_url);
	ws.on("open", function() {
		this.rpc("hello", router.name, function(name) {
			if (typeof name === "string")
				ws.remote = name;
			console.log("Connected to", ws.remote);
		});

		if (typeof init_callback === "function")
			init_callback(ws);
	});

	ws.module_name = router.register_static_dest("wsc", function(node, relative_name, do_not_add_to_history) {
		// this = rentry
		if (ws.closed) {
			if (!do_not_add_to_history) {
				this.missed_data = true;
			}
		} else {
			if (typeof this.missed_data === "undefined" || this.missed_data) {
				this.missed_data = false;
				ws.node_rpc(this.id + relative_name, "missed_data", node.time);
			}
			ws.node_rpc(this.id + relative_name, "data", node.time, node.value, false, do_not_add_to_history);
		}
	});

	ws.on("message", function(data) {
		router.process_message(basename, data, ws.module_name, ws, function(data) { ws.respond(data); }, ws);
	});

	require('./router_websocket_generic.js').init(router, ws, ws.module_name);

	return ws;
};

