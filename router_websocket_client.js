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
				console.log("bWSc: Exception (on message): " + e);
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

	registered_nodes = [];
	o_ws = new pwsc(ws_url, function() {
		if (typeof init_callback === "function")
			init_callback(o_ws);
	}, function(mdata) {
		if (mdata.hasOwnProperty('type')) {
			if (mdata.type == 'bind' && mdata.hasOwnProperty('node')) {
				var ref = router.register(mdata.node, "wsc", mdata.node, o_ws);
				registered_nodes.push({"node": mdata.node, "ref": ref});
			} else if (mdata.type == 'list') {
				o_ws.sendjson({"type":"dataset", "data":router.get_nodes()});
			} else if (mdata.type == 'data' && mdata.hasOwnProperty('node') &&
					mdata.hasOwnProperty('value') &&
					mdata.hasOwnProperty('time')) {
				router.route(basename + mdata.node, mdata.time, mdata.value);
			} else {
				console.log("WebSocketClient: Packet with unknown type received:",
						JSON.stringify(mdata));
			}
		}
	});

	o_ws.send_data = function(id, time, value) {
		o_ws.sendjson({"type":"data", "node":id, "time":time, "value":value});
	};
	o_ws.request = function(node) {
		o_ws.sendjson({"type":"bind", "node":node});
	};
	router.dests.wsc = function(id, time, value) {
		o_ws.send_data(id, time, value);
	};

	return o_ws;
};

