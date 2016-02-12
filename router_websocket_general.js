
exports.init = function(ws) {

	/* RPC functions */
	ws.registered_nodes = [];
	ws.rpc_node_bind = function(reply) {
		// this == node
		var ref = this.register("wsc", this.name, ws);

		// inform bind:
		ws.registered_nodes.push({"node": this.name, "ref": ref});

		reply(null, "okay");
	};
	ws.rpc_node_unbind = function(reply) {
		// this == node
		for(var i=0; i<ws.registered_nodes.length; i++) {
			if (this.name === ws.registered_nodes[i].node) {
				var regnode = ws.registered_nodes.splice(i, 1);
				this.unregister(regnode.ref);
				reply(null, "okay");
				return;
			}
		}
		reply("unregister: node not registered", this.node);
	};
	ws.rpc_hello = function(reply, name) {
		if (typeof name === "string")
			ws.name = name;
		reply(null, router.name);
	};


	/* local RPC functions */
	ws.rpc = function(method) {
		var args = Array.prototype.slice.call(arguments);
		var object = router._rpc_create_object.apply(router, args);
		ws.respond(object);
	};
	ws.node_rpc = function(node, method) {
		var args = Array.prototype.slice.call(arguments);
		//var node =
		args.shift();
		var object = router._rpc_create_object.apply(router, args);
		object.node = node;
		ws.respond(object);
	};

	/* local bind functions */
	ws.remote_nodes = [];
	ws.bind = function(node, not_persistent) {
		if (typeof not_persistent === "undefined" || !not_persistent) {
			ws.remote_nodes.push(node);
		}

		ws.node_rpc(node, "bind", function() {

		});
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
