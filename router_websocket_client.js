var WebSocket = require('ws');

// persistent websocket client:
var pwsc = function(wpath, cb_open, cb_msg) {
	this.wpath = wpath;
	this.cb_open = cb_open;
	this.cb_msg  = cb_msg;

	this.init();
};
pwsc.prototype.init = function() {
	try {
		var pthis = this;
		this.ws = new WebSocket(this.wpath);
		this.ws.on('open', function() {
			pthis.closed = false;
			pthis.cb_open();
		});
		this.ws.on('message', function(message) {
			try {
				var data = JSON.parse(message);
				pthis.cb_msg(data);
			} catch(e) {
				console.log("bWSc: Exception (on message): " + e, e.stack.split("\n"));
			}
		});
		this.ws.on('close', function() {
			pthis.closed = true;
			/* try to reconnect: Use  */
			pthis.ws.emit("need_reconnect");
		});
		this.ws.on('error', function() {
			pthis.closed = true;
			pthis.ws.emit("need_reconnect");
		});
		this.ws.on('need_reconnect', function() {
			pthis.ws = undefined;
			setTimeout(function() { pthis.init(); }, 1000);
		});

	} catch(e) {
		console.log("bWSc: Exception while creating socket: " + e);
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

	var o_ws = null;

	o_ws = new pwsc(ws_url, function() {
		// unbind old entries:
		if (typeof this.registered_nodes !== "undefined") {
			for(var i=0; i<this.registered_nodes.length; i++) {
				router.unregister(this.registered_nodes[i].node, this.registered_nodes[i].ref);
			}
			this.registered_nodes = [];
		}

		if (typeof init_callback === "function")
			init_callback(o_ws);
	}, function(data) {
		router.process_message(basename, data, "wsc", o_ws, function(data) { o_ws.respond(data); });
	});
	o_ws.registered_nodes = [];
	o_ws.inform_bind = function(node, ref) {
		o_ws.registered_nodes.push({"node": node, "ref": ref});
	};

	o_ws.respond = router.cue(function(data) {
		o_ws.sendjson(data);
	});
	o_ws.send_data = function(id, time, value, do_not_add_to_history) {
		o_ws.respond({"type":"data", "node":id, "time":time, "value":value, "add_to_history": do_not_add_to_history});
	};
	o_ws.request = function(node) {
		o_ws.respond({"type":"bind", "node":node});
	};

	router.dests.wsc = function(node, relative_name, do_not_add_to_history) {
		o_ws.send_data(this.id + relative_name, node.time, node.value, do_not_add_to_history);
	};

	return o_ws;
};

