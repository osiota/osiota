/*
 * Generic RPC WebSocket functions
 *
 * Simon Walz, IfN, 2016
 */

var EventEmitter = require('events').EventEmitter;


/* cmd state maschine:
 *
 *  -- open
 *     -- start
 *     |
 *     -- end
 *
 *     --start
 *     |
 *  -- close
 *
 *  -- open ( do a restart )
 *     |
 *     -- end
 *
 *  -- close
 */
var cmd_stack = function() {
	this.stack = {};
};
cmd_stack.prototype.get = function(key) {
	var _this = this;
	if (!this.stack.hasOwnProperty(key)) {
		var e = new EventEmitter();
		e.on("end", function() {
			this.removeAllListeners("open");
			this.removeAllListeners("close");
		});

		e.init = function(cb_start, cb_end) {
			e.emit("end");
			e.once("start", function() {
				cb_start.call(this, true);
			});
			e.on("open", function() {
				cb_start.call(this, false);
			});
			e.on("close", function() {
				cb_end.call(this, true);
			});
			e.once("end", function() {
				cb_end.call(this, false);
			});
			e.emit("start");
			return e;
		};
		e.end = function() {
			var cl = e.listeners("end").length;
			e.emit("end");
			_this.remove(key);
			return cl > 1;
		};

		this.stack[key] = e;
		return e;
	}
	return this.stack[key];
}
cmd_stack.prototype.remove = function(key) {
	if (this.stack.hasOwnProperty(key)) {
		delete this.stack[key];
		return true;
	}
	return false;
}
cmd_stack.prototype.emit = function(subkey) {
	for (var key in this.stack) {
		this.stack[key].emit(subkey);
	}
};

/* string key generated from method and nodename: */
var mnkey = function(nodename, method) {
	return method+"_"+nodename;
}

/* Persistent RPC functions */
var prpcfunction = function(cmd_stack_obj, method, cb_start, cb_end) {
	return function(reply) {
		// this == node
		var node = this;

		var e = cmd_stack_obj.get(mnkey(node.name, method));
		e.init(function() {
			this.ref = cb_start.apply(node, arguments);
		}, function() {
			cb_end.call(node, this.ref);
		});
		reply(null, "okay");
	};
};
var prpcfunction_remove = function(cmd_stack_obj, method) {
	return function(reply) {
		// this == node
		var node = this;
		var e = cmd_stack_obj.get(mnkey(node.name, method));
		if (e.end()) {
			reply(null, "okay");
		} else {
			reply("un"+method + ": not assigned: " + this.name);

		}
	};
};


exports.init = function(router, ws, module_name) {
	/* config */
	ws.remote = "energy-router";

	/* Send buffer: Use cue */
	ws.respond = router.cue(function(data) {
		ws.sendjson(data);
	});

	/* backward compatibility: local bind and unbind */
	ws.local_bind = function(node, target_name) {
		ws.node_local(node, "bind", target_name);
	};
	ws.local_unbind = function(node, ref) {
		ws.node_local(node, "unbind");
	};

	ws.cmds = new cmd_stack();

	/* RPC functions */
	ws.rpc_node_bind = prpcfunction(ws.cmds, "bind", function(target_name) {
		// this == node
		var node = this;
		if (typeof target_name !== "string")
			target_name = node.name;

		return node.register(module_name, target_name, ws);
	}, function(ref) {
		// this == node
		this.unregister(ref);
	});
	ws.rpc_node_unbind = prpcfunction_remove(ws.cmds, "bind");
	ws.rpc_node_subscribe_announcement = prpcfunction(ws.cmds, "subscribe_announcement", function() {
		// this == node
		var node = this;
		return this.subscribe_announcement(function(node) {
			ws.node_rpc(node, "announce");
		});
	}, function (ref) {
		return this.unsubscribe_announcement(ref);
	});
	ws.rpc_node_unsubscribe_announcement = prpcfunction_remove(ws.cmds, "subscribe_announcement");
	ws.rpc_node_subscribe = prpcfunction(ws.cmds, "subscribe", function() {
		// this == node
		var node = this;
		return this.subscribe(function(do_not_add_to_history, initial) {
			var node = this;
			if (initial === true)
				ws.node_rpc(node, "missed_data", node.time);
			ws.node_rpc(node, "data", node.time, node.value, false, do_not_add_to_history);
		});
	}, function (ref) {
		return this.unsubscribe(ref);
	});
	ws.rpc_node_unsubscribe = prpcfunction_remove(ws.cmds, "subscribe");


	ws.rpc_hello = function(reply, name) {
		if (typeof name === "string")
			ws.remote = name;
		reply(null, router.name);
	};
	ws.rpc_node_announce = prpcfunction(ws.cmds, "announce", function() {
		// this == node
		this.connection = ws;

		this.emit("node_update");
	}, function () {
		if (this.connection === ws)
			delete this.connection;
	});
	ws.rpc_node_unannounce = prpcfunction_remove(ws.cmds, "announce");

	ws.rpc_node_missed_data = function(reply, new_time) {
		// this = node
		var node = this;

		ws.sync_history(node, node.time, new_time);
		reply("thanks");
	};
	ws.rpc_node_where_are_you_from = function(reply) {
		// this == node
		console.log("I'm from " + this.router.name);
		reply(null, this.router.name);
	};

	/* helpers */
	ws.sync_history = function(node, fromtime, totime) {
		if (!node.hasOwnProperty("history")) {
			return;
		}
		node.history.synced = false;

		if (typeof totime === "undefiend")
			totime = null;
		if (typeof fromtime === "undefined")
			fromtime = null;

		ws.node_rpc(node.name, "history", {
			"interval": 0,
			"maxentries": null,
			"fromtime": fromtime,
			"totime": totime
		}, function(data) {
			// newest element is added via bind
			if (!totime)
				data.pop()

			data.forEach(function(d) {
				node.history.add(d.time, d.value);
			});
			node.history.synced = true;
			node.emit("history_synced");
		});
	};

	/* local RPC functions */
	ws.rpc = function(method) {
		if (ws.closed)
			return false;
		var args = Array.prototype.slice.call(arguments);
		var object = router._rpc_create_object.apply(router, args);
		ws.respond(object);
		return true;
	};
	ws.node_rpc = function(node, method) {
		if (ws.closed)
			return false;
		if (typeof node === "object")
			node = node.name;

		var args = Array.prototype.slice.call(arguments);
		//var node =
		args.shift();
		var object = router._rpc_create_object.apply(router, args);

		node = router.nodename_transform(node, ws.remote_basename, ws.basename);
		object.scope = "node";
		object.node = node;
		ws.respond(object);
		return true;
	};
	ws.node_local = function(node, method) {
		var args = Array.prototype.slice.call(arguments);
		//var node =
		args.shift();
		//var method =
		args.shift();

		var reply = function(error, data) {
			if (error !== null)
				console.error("RPC(local)-Error: ", error, data);
		};

		var n = router.node(node);
		if (typeof module === "object" && n._rpc_process("node_" + method, args, reply, ws)) {
			return;
		} else if (n._rpc_process(method, args, reply)) {
			return;
		}

		return true;
	};
	ws.node_prpc = function(node, method) {
		var ref = null;

		var e = ws.cmds.get(mnkey(node, "rpc"+method));
		return e.init(function() {
			ws.node_rpc(node, method, function(answer) {
				ref = answer;
			});
		}, function(closed) {
			if (!closed)
				ws.node_rpc(node, "un" + method, ref);
		});
	};
	ws.node_prpc_remove = function(node, method) {
		var e = ws.cmds.get(mnkey(node, "rpc"+method));
		return e.end();
	};

	/* local bind functions */
	ws.bind = function(node) {
		ws.node_prpc(node, "bind");
	};
	ws.unbind = function(node) {
		ws.node_prpc_remove(node, "bind");
	};

	ws.subscribe_announcement = function(node) {
		ws.node_prpc(node, "subscribe_announcement");
	};
	ws.unsubscribe_announcement = function(node) {
		ws.node_prpc_remove(node, "subscribe_announcement");
	};

	ws.subscribe = function(node) {
		ws.node_prpc(node, "subscribe");
	};
	ws.unsubscribe = function(node) {
		ws.node_prpc_remove(node, "subscribe");
	};

	ws.on("open", function() {
		ws.cmds.emit("open");
	});
	ws.on("close", function() {
		ws.cmds.emit("close");
	});

	return ws;
};
