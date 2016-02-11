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
		if (typeof o_ws.registered_nodes !== "undefined") {
			for(var i=0; i<o_ws.registered_nodes.length; i++) {
				router.unregister(o_ws.registered_nodes[i].node, o_ws.registered_nodes[i].ref);
			}
			o_ws.registered_nodes = [];
		}

		if (typeof init_callback === "function")
			init_callback(o_ws);
	
	}, function(data) {
		router.process_message(basename, data, "wsc", o_ws, function(data) { o_ws.respond(data); }, o_ws);
	});
	o_ws.registered_nodes = [];
	o_ws.rpc_node_bind = function(reply) {
		// this == node
		var ref = this.register("wsc", this.name, o_ws);

		// inform bind:
		o_ws.registered_nodes.push({"node": this.name, "ref": ref});

		reply(null, "okay");
	};

	o_ws.respond = router.cue(function(data) {
		o_ws.sendjson(data);
	});
	o_ws.send_data = function(id, time, value, do_not_add_to_history) {
		o_ws.node_rpc(id, "data", time, value, false, do_not_add_to_history);
	};
	o_ws.request = function(node) {
		o_ws.node_rpc(node, "bind");
	};
	o_ws.rpc = function(method) {
		var args = Array.prototype.slice.call(arguments);
		var object = router._rpc_create_object.apply(router, args);
		o_ws.respond(object);
	};
	o_ws.node_rpc = function(node, method) {
		var args = Array.prototype.slice.call(arguments);
		//var node =
		args.shift();
		var object = router._rpc_create_object.apply(router, args);
		object.node = node;
		o_ws.respond(object);
	};

	router.dests.wsc = function(node, relative_name, do_not_add_to_history) {
		o_ws.send_data(this.id + relative_name, node.time, node.value, do_not_add_to_history);
	};

	setInterval(function() {
		o_ws.ws.close();
	}, 5000);
//	return o_ws;
};

