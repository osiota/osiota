
exports.init = function(router, ws, module_name) {
	/* config */
	ws.remote = "energy-router";

	/* Send buffer: Use cue */
	ws.respond = router.cue(function(data) {
		ws.sendjson(data);
	});

	/* local bind and unbind */
	ws.registered_nodes = [];
	ws.local_bind = function(node, target_name) {
		if (typeof target_name !== "string")
			target_name = node.name;

		var ref = node.register(module_name, target_name, ws);

		// inform bind:
		ws.registered_nodes.push({"node": node.name, "ref": ref});
	};
	ws.local_unbind = function(node) {
		for(var i=0; i<ws.registered_nodes.length; i++) {
			if (node.name === ws.registered_nodes[i].node) {
				var regnode = ws.registered_nodes.splice(i, 1);
				node.unregister(regnode.ref);
				return true;
			}
		}
		return false;
	};

	/* RPC functions */
	ws.rpc_node_bind = function(reply, target_name) {
		// this == node
		ws.local_bind(this, target_name);
		reply(null, "okay");
	};
	ws.rpc_node_unbind = function(reply) {
		// this == node
		if (ws.local_unbind(this))
			reply(null, "okay");
		reply("unregister: node not registered", this.name);
	};
	ws.rpc_hello = function(reply, name) {
		if (typeof name === "string")
			ws.remote = name;
		reply(null, router.name);
	};
	ws.rpc_node_missed_data = function(reply, new_time) {
		// this = node
		var node = this;

		ws.sync_history(node, node.time, new_time);
		reply("thanks");
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
		var args = Array.prototype.slice.call(arguments);
		//var node =
		args.shift();
		var object = router._rpc_create_object.apply(router, args);

		node = router.nodename_transform(node, ws.remote_basename, ws.basename);
		object.node = node;
		ws.respond(object);
		return true;
	};

	/* local bind functions */
	ws.remote_nodes = [];
	ws.bind = function(node, not_persistent) {
		if (typeof not_persistent === "undefined" || !not_persistent) {
			ws.remote_nodes.push(node);
		}

		ws.node_rpc(node, "bind");
	};
	ws.unbind = function(node) {
		ws.node_rpc(node, "unbind");
		for(var i=0; i<ws.remote_nodes.length; i++) {
			if (node === ws.remote_nodes[i].node) {
				ws.remote_nodes.splice(i, 1);
				return;
			}
		}

	};
	ws.on("open", function() {
		ws.remote_nodes.forEach(function(node) {
			ws.bind(node, true);
		});
	});

	return ws;
};
