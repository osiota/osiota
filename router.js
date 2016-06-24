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

	this.subscription_listener = [];
	this.announcement_listener = [];
	this.listener = [];

	this.parentnode = parentnode;

	console.log("new node: " + name);

	RemoteCall.call(this);

	// subscripbe from remote host:
	var is_subscriped = false;
	var check_need_subscription = function() {
		if (is_subscriped) {
			if (this.listener.length == 0 && this.subscription_listener.length == 0) {
				this.rpc("unsubscribe");
				is_subscriped = false;

			}
		} else {
			if (this.listener.length > 0 || this.subscription_listener.length > 0) {
				this.rpc("subscribe");
				is_subscriped = true;
			}
		}
	};
	this.on('registered', check_need_subscription);
	this.on('unregistered', check_need_subscription);

	r.emit('create_new_node', this);

	this.announce();
};
util.inherits(exports.node, RemoteCall);
/* Get a node */
exports.node.prototype.node = function(name) {
	if (name.match(/^\//))
		return this.router.node(name);
	var is_parent = name.match(/^\.\.\/(.*)$/);
	if (is_parent && this.parentnode) {
		return this.parentnode.node(is_parent[1]);
	}
	return this.router.node(this.name + "/" + name);
};

/* Announce node */
exports.node.prototype.announce = function(node) {
	if (typeof node === "undefined") node = this;

	if (this.parentnode !== null) {
		this.parentnode.announce(node);
	}
	var _this = this;
	this.announcement_listener.forEach(function(f) {
		f.call(_this, node, false);
	});
}

/* Set new data */
exports.node.prototype.set = function(time, value, only_if_differ, do_not_add_to_history) {
	// convert from string to number:
	if (typeof time === "string")
		time = time*1;

	// if type is undefined: Use current time:
	if (typeof time === "undefined")
		time = new Date() / 1000;

	// if type not number:
	if (typeof time !== "number" && time !== null) {
		return false;
	}
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
		this.subscription_notify(do_not_add_to_history);
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
	this.emit("registered", rentry);

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
	if (typeof dnode !== "string")
		return;

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
				var r = this.listener.splice(j, 1);

				this.emit("unregistered", r[0]);
				return;
			} else if (this.listener[j].type === "node" &&
					this.listener[j].dnode === rentry.dnode) {
				var r = this.listener.splice(j, 1);

				this.emit("unregistered", r[0]);
				return;
			}
		}
	}
	console.log("\tfailed.");
};

/* Subscribe Listener */
exports.node.prototype.subscribe = function(object) {
	// Save the time when this entry was added
	object.time_added = new Date();

	this.subscription_listener.push(object);
	this.emit("registered", object);

	object.call(this, true, true);

	return object;
};

exports.node.prototype.unsubscribe = function(object) {
	for(var j=0; j<this.subscription_listener.length; j++) {
		if (this.subscription_listener[j] === object) {
			var r = this.subscription_listener.splice(j, 1);
			this.emit("unregistered", r[0]);
			return true;
		}
	}
	throw new Error("unsubscription failed: " + this.name);
};

/* Notify the subscriptions */
exports.node.prototype.subscription_notify = function(do_not_add_to_history) {
	if (typeof do_not_add_to_history === "undefined") {
		do_not_add_to_history = false;
	}

	var _this = this;
	this.subscription_listener.forEach(function(f) {
		f.call(_this, do_not_add_to_history, false);
	});
};

/* Announcement Listener */
exports.node.prototype.subscribe_announcement = function(object) {
	// Save the time when this entry was added
	object.time_added = new Date();

	this.announcement_listener.push(object);
	
	object.call(this, this, true);

	// get data of childs:
	var allchildren = this.router.get_nodes(this.name);
	for(var childname in allchildren) {
		var nc = allchildren[childname];
		object.call(this, nc, true);
	}

	return object;
};

exports.node.prototype.unsubscribe_announcement = function(object) {
	for(var j=0; j<this.announcement_listener.length; j++) {
		if (this.announcement_listener[j] === object) {
			this.announcement_listener.splice(j, 1);
			return true;
		}
	}
	throw new Error("unsubscription of announcements failed: " + this.name);
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
	var rentry = this.connect(dnode);
	reply(null, rentry);
};
exports.node.prototype.rpc_register = function(reply, dest, id, obj) {
	var rentry = this.register(dest, id, obj);
	reply(null, rentry);
};
exports.node.prototype.rpc_unregister = function(reply, rentry) {
	this.unregister(rentry);
	reply(null, "okay");
};
exports.node.prototype.rpc = function(method) {
	if (!this.hasOwnProperty("connection"))
		return false;
	var ws = this.connection;

	var args = Array.prototype.slice.call(arguments);

	// Add node object to arguments:
	args.unshift(this);
	ws.node_rpc.apply(ws, args);
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
exports.router = function(name) {
	this.nodes = {};
	this.dests = {};

	this.name = "energy-router";
	if (typeof name === "string")
		this.name = name;

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
	return Object.keys(this.dests);
};


/* Get data of a node */
exports.router.prototype.node = function(name, create_new_node) {
	if (typeof name === "object") return name;

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
exports.router.prototype.rpc_ping = function(reply) {
	reply(null, "ping");
};
exports.router.prototype.rpc_list = function(reply) {
	reply(null, this.nodes);
};
exports.router.prototype.rpc_dests = function(reply) {
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
			respond({"scope": "respond", "type": "reply", "args": [ rpc_ref, error, data ]});
		}
		rpc_ref = undefined;
	};

	try {
		if (!d.hasOwnProperty('type')) {
			throw new Error("Message type not defined: " + JSON.stringify(d));
		}
		var method = d.type;

		var scope = "global";
		if (d.hasOwnProperty('scope') && typeof d.scope === "string")
			scope = d.scope;
		// backward compatibility
		if (!d.hasOwnProperty('scope') && d.hasOwnProperty('node')) {
			scope = "node";
		}

		if (scope === "node") {
			if (!d.hasOwnProperty('node')) {
				throw new Error("Message scope needs attribute node: " + JSON.stringify(d));
			}
			var n = this.node(this.nodename_transform(d.node, module.basename, module.remote_basename));
			if (method === "data") {
				n.connection = obj;
			}
			if (typeof module === "object" && n._rpc_process("node_" + method, d.args, reply, module)) {
				return;
			} else if (n._rpc_process(method, d.args, reply)) {
				return;
			} else if (n._rpc_process("node_" + method, d.args, reply, this)) {
				return;
			} else if (typeof n.connection === "object" && n._rpc_forwarding(d, reply)) {
				return;
			}
		} else if (scope === "global") {
			if (typeof module === "object" && this._rpc_process(method, d.args, reply, module)) {
				return;
			} else if (this._rpc_process(method, d.args, reply)) {
				return;
			}
		} else if (scope === "respond" && method === "reply") {
			if (this._rpc_process(method, d.args, reply)) {
				return;
			}
		}
		throw new Error("Router, process message: packet with unknown rpc command received: " + scope + "." + method +
			" Packet: "+ JSON.stringify(d));

	} catch (e) {
		console.log("Exception (Router, process_single_message:\n", e);
		console.log("Packet: "+ JSON.stringify(d));
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

exports.router.prototype.nodename_transform = function(nodename, basename_add, basename_remove) {
	if (typeof basename_remove === "string") {
		var regex = new RegExp("^" + RegExp.quote(basename_remove) + "(/.*)$", '');
		var found = nodename.match(regex)
		if (found) {
			nodename = found[1];
		} else {
			throw new Error("nodename_transform: Basename not found: " + basename_remove);
		}
	}
	if (typeof basename_add === "string") {
		nodename = basename_add + nodename;
	}

	return nodename;
}


/* on signal: end the process */
if (process.on) { /* if NodeJS */
	process.on('SIGINT', function() { process.exit(0); });
	process.on('SIGTERM', function() { process.exit(0); });
}

