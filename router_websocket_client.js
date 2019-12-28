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
	this.freezed = false;
	this._destroy = false;

	this.tid = null;
	this.on('need_reconnect', function(timeout) {
		if (typeof timeout !== "number") {
			timeout = 1000;
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

		var pthis = this;
		this.tid = setTimeout(function() { pthis.init(); }, timeout);
	});

	this.init();
};
util.inherits(pwsc, EventEmitter);

pwsc.prototype.init = function() {
	var pthis = this;
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
		this.ws.on('open', function() {
			pthis.closed = false;
			pthis.emit('open');
		});
		this.ws.on('message', function(message) {
			pthis.recvjson(message);
		});
		this.ws.on('close', function(code, message) {
			console.log("BasicWebSocket closing", this.remote,
				"code", code, "message", message,
				"reconnect", this.reconnect);
			/* try to reconnect: Use  */
			if (!this.reconnect) {
				this.reconnect = true;
				pthis.emit("need_reconnect");
			}
		});
		this.ws.on('error', function(err) {
			if (err) console.log("bWSc: Error:", err.stack || err);
			else console.log("bWSc: Error.");

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
			pthis.emit("need_reconnect", 3000);
		}
	}
};
pwsc.prototype.sendjson_raw = function(message) {
	//console.log("send:", message);
	this.ws.send(message);
};
pwsc.prototype.sendjson = function(data) {
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
pwsc.prototype.recvjson = function(message) {
	//console.log('received:', message);
	try {
		// Browser WebSocket sends an event
		// with message in field data:
		if (typeof message === "object" && message.data)
			message = message.data;

		var data = JSON.parse(message);
		this.emit('message', data);
	} catch(e) {
		console.log("bWSc: Exception (on message):",
				e.stack || e);
		console.log("message:", message);
	}
};
pwsc.prototype.close = function() {
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

	ws.on("message", function(data) {
		router.process_message(basename, data,
				ws.respond.bind(ws), ws);
	});

	require('./router_websocket_generic.js').init(router, ws);

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
