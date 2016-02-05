/*
 * DATA BROKER
 * A nodejs service to handle, subscribe and push data.
 *
 * Simon Walz, IfN, 2015
 */

var util = require('util');

/* Helper: */
RegExp.quote = function(str) {
	    return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
};

var RemoteCall = require('./router_remotecall.js').remotecall;

/* Class: Node */
exports.node = function(r, name, parentnode) {
	this.name = name;
	if (typeof name === "string") {
		this.nodename = name.replace(/^.*([\/@])/, '$1');
	}

	this.router = r;

	this.value = null;
	this.time = null;

	this.listener = [];

	this.parentnode = parentnode;

	console.log("new node: " + name);

	RemoteCall.call(this);

	r.emit('create_new_node', this);
};
util.inherits(exports.node, RemoteCall);
/* Set new data */
exports.node.prototype.set = function(time, value, only_if_differ, do_not_add_to_history) {
	// cancel if timestamp did not change:
	if (this.time !== null &&
			this.time === time) {
		return false;
	}
	// cancel if node did not change:
	if (typeof only_if_differ !== "undefined" &&
			only_if_differ &&
			this.value !== null &&
			this.value === value) {
		return false;
	}

	// set new data:
	this.value = value;
	this.time = time;

	this.emit('set', time, value, only_if_differ, do_not_add_to_history);

	return true;
};
/* Route data */
exports.node.prototype.route = function(node, relative_name, do_not_add_to_history) {
	if (typeof relative_name === "undefined") {
		relative_name = "";
	}

	// route the data according to the routing entries:
	if (this.hasOwnProperty("listener")) {
		for(var i=0; i<this.listener.length; i++) {
			node.route_one(this.listener[i], relative_name, do_not_add_to_history);
		}
	}

	if (this.parentnode !== null) {
		this.parentnode.route(node, this.nodename + relative_name, do_not_add_to_history);
	}
};

/* Route data (synchronous) */
exports.node.prototype.publish_sync = function(time, value, only_if_differ, do_not_add_to_history) {
	if (this.set(time, value, only_if_differ, do_not_add_to_history)) {
		this.route(this, "", do_not_add_to_history);
	}
};

/* Route data (asynchronous) */
exports.node.prototype.publish = function(time, value, only_if_differ, do_not_add_to_history) {
	var n = this;
	process.nextTick(function() {
		n.publish_sync(time, value, only_if_differ, do_not_add_to_history);
	});
};

/* Route data by a single routing entry */
exports.node.prototype.route_one = function(rentry, relative_name, do_not_add_to_history) {
	if (typeof relative_name === "undefined") {
		relative_name = "";
	}
	if (typeof do_not_add_to_history === "undefined") {
		do_not_add_to_history = false;
	}

	if (typeof rentry.type === "string") {
		if (rentry.type == "function" && typeof rentry.dest === "string") {
			var dest_f = this.router.get_static_dest(rentry.dest);
			try {
				dest_f.call(rentry, this, relative_name, do_not_add_to_history);

			} catch (e) {
				console.log("Exception (Router, call dest \""+rentry.dest+"\"):\n", e);
			}
		} else if (rentry.type == "node" && typeof rentry.dnode === "string") {
			this.router.publish(rentry.dnode + relative_name, this.time, this.value, do_not_add_to_history);
		} else {
			console.log("Route [" + this.name + "]: Unknown destination type: ", rentry.type);
		}
	}
};

/* Add a routing entry */
exports.node.prototype.add_rentry = function(rentry, push_data) {
	if (typeof rentry !== "object") {
		console.log("Router. Error: Type of rentry is not object. Type is: " + typeof rentry);
		return;
	}
	if (typeof push_data !== "boolean") {
		push_data = true;
	}
	if (!this.hasOwnProperty("listener")) {
		this.listener = [];
	}

	// Save the time when this entry was added
	rentry.time_added = new Date();

	// add routing entry
	this.listener.push(rentry);

	// push data to new entry:
	if (push_data) {
		this.route_one(rentry);

		// get data of childs:
		var allchildren = this.router.get_nodes(this.name);
		for(var childname in allchildren) {
			var nc = allchildren[childname];
			nc.route_one(rentry, childname);
		}
	}

	return rentry;
};

/* Register a callback or a link name for a route */
exports.node.prototype.register = function(dest, id, obj, push_data) {
	console.log("registering " + this.name);

	var rentry = {};

	var sdest = this.router.get_static_dest(dest);
	if (typeof sdest === "undefined") {
		console.log("Router. Error: Register function not found on ", dest);
		return;
	}

	rentry.dest = dest;
	rentry.id = id;
	rentry.obj = obj;
	rentry.type = "function";

	return this.add_rentry(rentry, push_data);
};


/* Register a link name for a route */
exports.node.prototype.connect = function(dnode) {
	if (Array.isArray(dnode)) {
		var re = null;
		for (var tid=0; tid<dnode.length; tid++) {
			re = this.connect(dnode[tid]);
		}
		return re;
	}

	console.log("connecting " + this.name + " to " + dnode);

	rentry = {};

	// Set ref:
	if (typeof dnode !== "string") {
		console.log("Router. Error: Type of node is not string. Type is: " + typeof dnode);
		return;
	}
	// node.connections.push(dnode);

	rentry.dnode = dnode;
	rentry.type = "node";

	return this.add_rentry(rentry);
};

/* Delete a routing entry */
exports.node.prototype.unregister = function(rentry) {
	console.log("unregistering " + this.name);
	if (this.hasOwnProperty("listener")) {
		for(var j=0; j<this.listener.length; j++) {
			if (this.listener[j] === rentry) {
				this.listener.splice(j, 1);
				return;
			} else if (this.listener[j].type === "node" &&
					this.listener[j].dnode === rentry.dnode) {
				this.listener.splice(j, 1);
				return;
			}
		}
	}
	console.log("\tfailed.");
};

/* Get a copy of the listeners */
exports.node.prototype.get_listener = function(rentry) {
	var npr = {};
	npr.type = rentry.type;
	if (rentry.type == "function" && typeof rentry.dest === "string") {
		npr.dest = rentry.dest;
		if (rentry.hasOwnProperty("id"))
			npr.id = rentry.id;
	} else if (rentry.type == "node" && typeof rentry.dnode === "string") {
		npr.dnode = rentry.dnode;
	}
	return npr;
};

/* Remote procedure calls */
exports.node.prototype.rpc_data = function(reply, time, value, only_if_differ, do_not_add_to_history) {
	this.publish(time, value, only_if_differ, do_not_add_to_history);
	reply(null, "okay");
};
exports.node.prototype.rpc_connect = function(reply, dnode) {
	this.connect(dnode);
	reply(null, "okay");
};
exports.node.prototype.rpc_register = function(reply, dest, id, obj) {
	this.register(dest, id, obj);
	reply(null, "okay");
};
exports.node.prototype.rpc_register = function(reply, rentry) {
	this.unregister(rentry);
	reply(null, "okay");
};

/* Overwrite function to convert object to string: */
exports.node.prototype.toJSON = function() {
	var n = {};
	n.value = this.value;
	n.time = this.time;

	n.listener = [];
	var _this = this;
	if (this.hasOwnProperty("listener")) {
		n.listener = this.listener.map(function(rentry) {
			return _this.get_listener(rentry);
		});
	}

	// stringify ??
	return n;
};




/* Class: Router */
exports.router = function() {
	this.nodes = {};
	this.dests = {};

	RemoteCall.call(this);
};
util.inherits(exports.router, RemoteCall);

/* Register a callback or a link name for a route */
exports.router.prototype.register = function(name, dest, id, obj, push_data) {
	var n = this.node(name);
	return n.register(dest, id, obj, push_data);
};

/* Register a link name for a route */
exports.router.prototype.connect = function(name, dnode) {
	var n = this.node(name);
	return n.connect(dnode);
};

/* Register multiple connections */
exports.router.prototype.connectArray = function(nodes) {
	for (var from in nodes) {
		this.connect(from, nodes[from]);
	}

};

/* Delete a routing entry */
exports.router.prototype.unregister = function(name, rentry) {
	var n = this.node(name);
	return n.unregister(rentry);
};

/* Route data */
exports.router.prototype.publish = function(name, time, value, only_if_differ, do_not_add_to_history) {
	var n = this.node(name);
	n.publish(time, value, only_if_differ, do_not_add_to_history);
}


/* Get names and data of the nodes */
exports.router.prototype.get_nodes = function(basename) {
	if (typeof basename !== "string") basename = "";

	var nodes = {};
	var _this = this;

	// Sort keys:
	Object.keys(this.nodes).sort().forEach(function(name) {
		var n = _this.nodes[name];

		// Filter nodes:
		var regex = new RegExp("^" + RegExp.quote(basename) + "(/.*)$", '');
		var found = name.match(regex)
		if (found) {
			nodes[found[1]] = n;
		}
	});
	return nodes;
};

/* Overwrite function to convert object to string: */
exports.router.prototype.toJSON = function() {
	var r = {};
	r.nodes = this.nodes.toJSON();
	//r.dests = this.get_dests();
	return r;
};


/* Get names and data of destinations */
exports.router.prototype.get_dests = function() {
	var dests = [];
	return Object.keys(this.dests);
};


/* Get data of a node */
exports.router.prototype.node = function(name, create_new_node) {
	if (name == "") name = "/";

	if (this.nodes.hasOwnProperty(name)) {
		return this.nodes[name];
	}
	if (typeof create_new_node !== "undefined" && create_new_node === false) {
		//throw new Error("node not found.");
		return new exports.node(this, null);
	}
	// get parent node:
	var parentnode = null;
	if (!name.match(/^[\/@]*$/)) {
		var parentname = name.replace(/[\/@][^\/@]*$/, "");
		parentnode = this.node(parentname);
	}
	this.nodes[name] = new exports.node(this, name, parentnode);
	return this.nodes[name];
};

/* set function for destination name */
exports.router.prototype.register_static_dest = function(name, func, force_name) {
	if (typeof force_name === "undefined")
		force_name = false;
	append = "";
	while (this.dests.hasOwnProperty(name + append)) {
		if (append == "")
			append = 2;
		else
			append++;
	}

	this.dests[name + append] = func;
	return name + append;
};
/* get function for destination name */
exports.router.prototype.get_static_dest = function(name) {
	if (this.dests.hasOwnProperty(name)) {
		return this.dests[name];
	}
	return undefined;
};
/* Remote procedure calls */
exports.router.prototype.rpc_list = function(reply) {
	reply(null, this.nodes);
};
exports.router.prototype.rpc_get_dests = function(reply) {
	reply(null, this.get_dests());
};

/* process a single command message */
exports.router.prototype.process_single_message = function(basename, d, cb_name, obj, respond, module) {
	var rpc_ref = d.ref;
	var reply = function(error, data) {
		if (typeof rpc_ref !== "undefined") {
			if (typeof error === "undefined") {
				error = null;
			}
			respond({"type": "reply", "args": [ rpc_ref, error, data ]});
		}
		rpc_ref = undefined;
	};

	try {
		if (!d.hasOwnProperty('type')) {
			throw new Error("Message type not defined: " + JSON.stringify(d));
		}
		var method = d.type;
		if (d.hasOwnProperty('node')) {
			var n = this.node(basename + d.node);
			if (typeof module === "object" && n._rpc_process("node_" + method, d.args, reply, module)) {
				// nothing.
			} else if (n._rpc_process(method, d.args, reply)) {
				// nothing.
			} else if (method == 'bind') {
				console.log("use of deprecate function.")
				var ref = n.register(cb_name, d.node, obj);

				if (typeof obj !== "undefined" && obj !== null && typeof obj.inform_bind == "function") {
					obj.inform_bind(n.name, ref);
					//ws.registered_nodes.push({"node": d.node, "ref": ref});
				}
			} else if (method == 'data' &&
					d.hasOwnProperty('value') &&
					d.hasOwnProperty('time')) {
				console.log("use of deprecate function.")
				n.publish(d.time, d.value);
			} else if (method == 'connect' &&
					d.hasOwnProperty('dnode')) {
				console.log("use of deprecate function.")
				n.connect(d.dnode);
			} else if (method == 'register' &&
					d.hasOwnProperty('dest')) {
				console.log("use of deprecate function.")
				n.register(d.dest, d.id, d.obj);
			} else if (method == 'unregister' &&
					d.hasOwnProperty('rentry')) {
				console.log("use of deprecate function.")
				n.unregister(d.rentry);
			} else if (method == 'get_history' &&
					d.hasOwnProperty('interval')) {
				console.log("use of deprecate function.")
				respond({"type": "history", "node": d.node, "data": n.get_history(d.interval) });
			} else {
				throw new Error("Router, Process message: Packet with unknown (node) command received: "+ method+
					" Packet: "+ JSON.stringify(d));
			}
		} else {
			if (typeof module === "object" && this._rpc_process(method, d.args, reply, module)) {
				// nothing.
			} else if (this._rpc_process(method, d.args, reply)) {
				// nothing.
			} else if (method == 'list') {
				console.log("use of deprecate function.")
				respond({"type":"dataset", "data":this.nodes});
			} else if (method == 'get_dests') {
				console.log("use of deprecate function.")
				respond({"type":"dests", "data":this.get_dests()});
			// TODO:
			} else if (method == 'dataset' && d.hasOwnProperty('data')) {
				console.log("use of deprecate function.")
				for (var node in d.data) {
					console.log("node: ", node);
				}
			} else if (method == 'reload_module' && d.hasOwnProperty('module') && typeof d.module === "string" && d.module.match(/^\w+$/)) {
				console.log("use of deprecate function.")
				require('./router_' + d.module + '.js').init(this);
			} else {
				throw new Error("Router, Process message: Packet with unknown type received: " + method +
					" Packet: "+ JSON.stringify(d));
			}
		}
	} catch (e) {
		console.log("Exception (Router, process_single_message:\n", e);
		reply("Exception", e);
	}
};

/* process command messages (ie from websocket) */
/* TODO: delete arguments: cb_name, obj */
exports.router.prototype.process_message = function(basename, data, cb_name, obj, respond, module) {
	var r = this;
	if (typeof respond !== "function")
		respond = function() {};

	if (!Array.isArray(data)) {
		data = [data];
	}

	data.forEach(function(d) {
		r.process_single_message(basename, d, cb_name, obj, respond, module);

	});
};

/* Cue data */
exports.router.prototype.cue = function(callback) {
	var cue_data = [];
	return function(entry) {
		cue_data.push(entry);
		process.nextTick(function() {
			try {
				if (cue_data.length > 0) {
					var data = cue_data.splice(0,cue_data.length);
					callback(data);
				}
			} catch (e) {
				console.log("Exception (Router, cue):\n", e);
			}
		});
	};
};
/* direct data processing without cue */
exports.router.prototype.no_cue = function(callback) {
	return function(data) {
		try {
			callback(data);
		} catch (e) {
			console.log("Exception (Router, nocue):\n", e);
		}
	};
};


/* on signal: end the process */
process.on('SIGINT', function() { process.exit(0); });
process.on('SIGTERM', function() { process.exit(0); });

