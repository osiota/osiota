/*
 * Generic RPC WebSocket functions
 *
 * Simon Walz, IfN, 2016
 */

const unload_object = require("unload-object").unload;

const EventEmitter = require('events').EventEmitter;

const nodename_transform = require("./helper_nodenametransform").nodename_transform;
const queue = require("./helper_queue").queue;


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
class cmd_stack {
	constructor() {
		this.stack = {};
	};
	get(key) {
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
			/* istanbul ignore next unused? */
			e.init_single = function(cb_start, cb_end) {
				e.emit("end");
				e.once("start", function() {
					cb_start.call(this, true);
				});
				e.once("close", function() {
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
	remove(key) {
		if (this.stack.hasOwnProperty(key)) {
			delete this.stack[key];
			return true;
		}
		return false;
	}
	emit(subkey) {
		for (var key in this.stack) {
			this.stack[key].emit(subkey);
		}
	};
};

/* string key generated from method and nodename: */
var mnkey = function(nodename, method) {
	return method+"_"+nodename;
}

/* unload on close functions */
var single_function = function(cmd_stack_obj, method, cb_start, cb_end) {
	return function(reply) {
		// args:
		var args = Array.prototype.slice.call(arguments);
		//var reply =
		args.shift();

		// this == node
		var node = this;
		var e = cmd_stack_obj.get(mnkey(node.name, method));

		// call start function:
		var ref = cb_start.apply(node, args);

		// define unload function
		if (typeof e.unload === "function")
			e.unload();
		e.unload = function() {
			if (ref) {
				e.removeAllListeners("close");
				unload_object(ref);
				ref = null;
				e.unload = null;
			}
		};
		e.once("close", e.unload);

		reply(null, "okay");
	};
};
var single_function_remove = function(cmd_stack_obj, method) {
	return function(reply) {
		// this == node
		var node = this;
		var e = cmd_stack_obj.get(mnkey(node.name, method));

		if (e.unload) {
			e.unload();
			reply(null, "okay");
		} else {
			reply("un"+method + ": not assigned: " + this.name);

		}
	};
};


exports.init = function(router, rpcstack, ws) {
	/* config */
	ws.remote = "[unknown]";

	/* Send buffer: Use queue */
	ws.respond = queue(function(data) {
		ws.sendjson(data);
	});

	ws.cmds = new cmd_stack();

	/* RPC functions */
	ws.rpc_node_subscribe_announcement = single_function(ws.cmds, "subscribe_announcement", function() {
		if (ws.closed)
			return false;
		// this == node
		return this.subscribe_announcement(function(node, method,
					initial, update) {
			// Do not send remote nodes back to the same system:
			if (typeof node.connection !== "undefined" &&
					node.connection === ws) {
				return;
			}
			if (method == "announce" && update) {
				method = "announce_update";
			}
			ws.node_rpc(node, method, node.metadata);
		});
	}, function (ref) {
		return this.unsubscribe_announcement(ref);
	});
	ws.rpc_node_unsubscribe_announcement = single_function_remove(ws.cmds, "subscribe_announcement");
	ws.rpc_node_subscribe = single_function(ws.cmds, "subscribe", function() {
		// this == node
		if (ws.closed)
			return false;

		return this.subscribe(function(do_not_add_to_history, initial) {
			var node = this;
			if (initial === true) {
				if (node.hasOwnProperty("history")) {
					ws.node_rpc(node, "missed_data", node.time);
				}
			}
			//todo: use annoymous persistent callback:
			ws.node_rpc(node, "data", node.time, node.value, false, do_not_add_to_history, initial);
		});
	});
	ws.rpc_node_subscribe_for_aggregated_data = single_function(ws.cmds,
			"subscribe", /* istanbul ignore next deprecated */
				function(policy) {
		var policy_checker = router.policy_checker;
		var callback;
		if (policy.action_extra.type == "count") {
			callback = policy_checker.aggregate.
					create_callback_by_count(this, policy,
					function(time, value, node) {
				ws.node_rpc(node, "data", time, value, false,
						false);
			})
		} else if (policy.action_extra.type == "time") {
			callback = policy_checker.aggregate.
				create_callback_by_time(this, policy,
					function(time, value, node) {
				ws.node_rpc(node, "data", time, value, false,
						false);
			})
		} else {
			throw new Error("subscribe_for_aggregated_data: " +
					"Unknown callback type");
		}
		return this.subscribe(callback);
	});

	ws.rpc_node_unsubscribe = single_function_remove(ws.cmds, "subscribe");


	ws.rpc_global_error = function(reply, name, message) {
		console.warn("remote error", name);
	};
	ws.rpc_global_hello = function(reply, name) {
		// TODO login: check login, asynchron

		if (typeof name === "string") {
			ws.remote = name;
			console.log("Hello", name, "("+ws._socket.remoteAddress+")");
		}
		reply(null, router.name);
	};
	ws.rpc_node_announce = single_function(ws.cmds, "announce", function(metadata) {
		// this == node
		var node = this;

		// Meta data key for identification and limiting hops
		if (typeof metadata.__osiota_remote !== "number") {
			metadata.__osiota_remote = 1;
		} else {
			metadata.__osiota_remote++;
			if (metadata.__osiota_remote > 16) {
				return;
			}
		}
		node.connection = ws;
		node.announce(metadata);

		node.emit("node_update", true);

		return function() {
			if (node.connection === ws) {
				node.unannounce();
				node.connection = null;
			}
		};
	});
	ws.rpc_node_unannounce = single_function_remove(ws.cmds, "announce");

	ws.rpc_node_announce_update = function(reply, metadata) {
		// this == node
		var node = this;

		// Meta data key for identification and limiting hops
		if (typeof metadata.__osiota_remote !== "number") {
			metadata.__osiota_remote = 1;
		} else {
			metadata.__osiota_remote++;
			if (metadata.__osiota_remote > 16) {
				return;
			}
		}
		node.announce(metadata, true);

		node.emit("node_update", true);

		reply(null, "okay");
	};

	ws.rpc_node_missed_data = function(reply, new_time) {
		// this = node
		var node = this;

		if (!node.hasOwnProperty("history")) {
			reply(null, "thanks");
			return;
		}

		if (node.time) {
			ws.sync_history(node, node.time, new_time);
			reply(null, "thanks");
		} else {
			// get last timestamp from history database:
			var last_timeslot = node.history.get({
				maxentries: 1,
				interval: null,
				local: true
			}, function(data) {
				if (data.length === 0) {
					ws.sync_history(node, null, new_time);
				} else {
					ws.sync_history(node, data[0].time, new_time);
				}
				reply(null, "thanks");
			});
		}
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

		ws.node_rpc(node, "history", {
			"interval": 0,
			"maxentries": null,
			"fromtime": fromtime,
			"totime": totime
		}, function(err, data) {
			if (err) {
				console.warn("history: unable to load data:", err);
				return;
			}
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
		var object = rpcstack._rpc_create_object(ws, ws, args);
		ws.respond(object);
		return true;
	};
	ws.node_rpc = function(node, method) {
		if (ws.closed)
			return false;
		if (typeof node !== "object")
			throw new Error("Node is not an object");

		var args = Array.prototype.slice.call(arguments);
		//var node =
		args.shift();
		var object = rpcstack._rpc_create_object(ws, node, args);

		if (router.hasOwnProperty('policy_checker')) {
			// checks if the remote is allowed to perform this
			// method on this node
			try {
				var reaction = router.policy_checker.check(
						node, ws.wpath,
						method, 'to_remote');
				if (reaction != null && reaction.reaction_id
						== 'hide_value_and_metadata'){
					if (object.args.length > 1) {
						object.args.splice(1, 1);
					}
				}
			} catch (e) {
				console.log("Blocked", e.stack || e);
				return false;

				// TODO: The error message shall be
				// passed to the callback.
			}
		}

		if (typeof node.name !== "string")
			console.error("node", node);
		var nodename = nodename_transform(node.name, ws.remote_basename,
				ws.basename);

		object.scope = "node";
		object.node = nodename;
		ws.respond(object);
		return true;
	};
	ws.node_local = function(node, method) {
		if (typeof node !== "object")
			throw new Error("Node is not an object");

		var args = Array.prototype.slice.call(arguments);
		//var node =
		args.shift();
		//var method =
		args.shift();

		var reply = function(error, data) {
			if (error !== null)
				console.error("RPC(local)-Error: ", error, data);
		};

		if (typeof module === "object" && rpcstack._rpc_process("node_" + method, args, reply, node, ws)) {
			return;
		} else if (rpcstack._rpc_process(method, args, reply, node)) {
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

	ws.node_plocal = function(node, method) {
		var ref = null;

		var e = ws.cmds.get(mnkey(node, "local"+method));
		return e.init(function() {
			ws.node_local(node, method, function(answer) {
				ref = answer;
			});
		}, function(closed) {
			if (!closed)
				ws.node_local(node, "un" + method, ref);
		});
	};
	ws.node_plocal_remove = function(node, method) {
		var e = ws.cmds.get(mnkey(node, "local"+method));
		return e.end();
	};


	/* local functions */
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
		// move to hello reply
		setImmediate(function() {
			ws.cmds.emit("open");
		});
	});
	ws.on("close", function(code, message) {
		if (code || message) {
			console.log("WebSocket closing", router.name,
				"to",  ws.remote,
				"code", code, "message", message);
		} else {
			console.log("WebSocket closing", router.name,
				"to",  ws.remote);
		}
		ws.cmds.emit("close");
	});

	return ws;
};
