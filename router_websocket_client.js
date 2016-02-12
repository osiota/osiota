var WebSocket = require('ws');
var EventEmitter = require('events').EventEmitter;

// persistent websocket client:
var pwsc = function(wpath) {
	EventEmitter.call(this);

	this.wpath = wpath;

	this.closed = true;
	this.reconnect = false;

	this.on('need_reconnect', function() {
		this.ws = undefined;

		this.emit("close");

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
		if (typeof this.ws !== "undefined" &&
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
		// unbind old entries:
		if (typeof ws.registered_nodes !== "undefined") {
			for(var i=0; i<ws.registered_nodes.length; i++) {
				router.unregister(ws.registered_nodes[i].node, ws.registered_nodes[i].ref);
			}
			ws.registered_nodes = [];
		}

		this.remote = "energy-router";
		this.rpc("hello", router.name, function(name) {
			if (typeof name === "string")
				this.remote = name;
			console.log("Connected to " + this.remote);
		});

		if (typeof init_callback === "function")
			init_callback(ws);
	});
	ws.on("message", function(data) {
		router.process_message(basename, data, "wsc", ws, function(data) { ws.respond(data); }, ws);
	});

	ws.respond = router.cue(function(data) {
		ws.sendjson(data);
	});
	ws.send_data = function(id, time, value, do_not_add_to_history) {
		ws.node_rpc(id, "data", time, value, false, do_not_add_to_history);
	};

	router.dests.wsc = function(node, relative_name, do_not_add_to_history) {
		ws.send_data(this.id + relative_name, node.time, node.value, do_not_add_to_history);
	};

	require('./router_websocket_general.js').init(ws, "wsc");

	return ws;
};

