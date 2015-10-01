
/* Class: Router */
exports.router = function() {
	this.nodes = {};
	this.dests = {};
};

/* Register a callback or a link name for a route */
exports.router.prototype.register = function(name, dest, id, obj, push_data) {
	console.log("registering " + name);

	var rentry = {};

	var sdest = this.get_static_dest(dest);
	if (typeof sdest === "undefined") {
		console.log("Router. Error: Register function not found on " + dest);
		return;
	}

	rentry.dest = dest;
	rentry.id = id;
	rentry.obj = obj;
	rentry.type = "function";

	return this.add_rentry(name, rentry, push_data);
};

/* Register a link name for a route */
exports.router.prototype.connect = function(name, dnode) {
	console.log("connecting " + name);

	rentry = {};

	// Set ref:
	if (typeof dnode !== "string") {
		console.log("Router. Error: Type of node is not string. Type is: " + typeof dnode);
		return;
	}

	rentry.dnode = dnode;
	rentry.type = "node";

	return this.add_rentry(name, rentry);
};

exports.router.prototype.add_rentry = function(name, rentry, push_data) {
	if (typeof rentry !== "object") {
		console.log("Router. Error: Type of rentry is not object. Type is: " + typeof rentry);
		return;
	}
	if (typeof push_data !== "boolean") {
		push_data = true;
	}

	if (!this.nodes.hasOwnProperty(name))
		this.nodes[name] = {};
	if (!this.nodes[name].hasOwnProperty("listener")) {
		this.nodes[name].listener = [];
	}

	// Save the time when this entry was added
	rentry.time_added = new Date();

	// add routing entry
	this.nodes[name].listener.push(rentry);

	// push data to new entry:
	if (push_data) {
		if (this.nodes.hasOwnProperty(name) &&
				this.nodes[name] !== null &&
				this.nodes[name].hasOwnProperty("value") &&
				this.nodes[name].hasOwnProperty("time")) {
			this.route_one(rentry, name, this.nodes[name].time, this.nodes[name].value);
		} else {
			this.route_one(rentry, name, null, null);
		}
	}

	return rentry;
};

/* Delete a routing entry */
exports.router.prototype.unregister = function(name, rentry) {
	console.log("unregistering " + name);
	if (this.nodes.hasOwnProperty(name) &&
			this.nodes[name].hasOwnProperty("listener")) {
		for(var j=0; j<this.nodes[name].listener.length; j++) {
			if (this.nodes[name].listener[j] === rentry) {
				this.nodes[name].listener.splice(j, 1);
				return;
			} else if (this.nodes[name].listener[j].type === "node" &&
					this.nodes[name].listener[j].dnode === rentry.dnode) {
				this.nodes[name].listener.splice(j, 1);
				return;
			}
		}
	}
	console.log("\tfailed.");
};

/* Route a single routing entry */
exports.router.prototype.route_one = function(rentry, name, time, value) {

	if (typeof rentry.type === "string") {
		if (rentry.type == "function" && typeof rentry.dest === "string") {
			var dest_f = this.get_static_dest(rentry.dest);
			dest_f(rentry.id, time, value, name, rentry.obj);
		} else if (rentry.type == "node" && typeof rentry.dnode === "string") {
			this.route(rentry.dnode, time, value);
		} else {
			console.log("Route [" + name + "]: Unknown destination type: ", rentry.type);
		}
	}
};

/* Route data */
exports.router.prototype.route_synchronous = function(name, time, value, only_if_differ) {
	// is a new node?
	if (!this.nodes.hasOwnProperty(name)) {
		console.log("new node: " + name);
		this.nodes[name] = {};
	}
	// cancel if timestamp did not change:
	var node = this.nodes[name];
	if (node.hasOwnProperty("time") &&
			node.time == time) {
		return;
	}
	// cancel if node did not change:
	var node = this.nodes[name];
	if (typeof only_if_differ !== "undefined" &&
			only_if_differ &&
			node.hasOwnProperty("value") &&
			node.value == value) {
		return;
	}

	// set new data:
	node.value = value;
	node.time = time;

	// route the data according to the routing entries:
	if (node.hasOwnProperty("listener")) {
		for(var i=0; i<node.listener.length; i++) {
			this.route_one(node.listener[i], name, time, value);
		}
	}

	// inform parents:
};

/* Route data */
exports.router.prototype.route = function(name, time, value, only_if_differ) {
	var r = this;
	process.nextTick(function() {
		r.route_synchronous(name, time, value, only_if_differ);
	});
}

/* Get a copy of the listeners */
exports.router.prototype.get_listener = function(rentry) {
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

/* Get names and data of the nodes */
exports.router.prototype.get_nodes = function() {
	var r = this;
	var nodes = {};
	for (var name in this.nodes) {
		var n = this.nodes[name];
		var np = {};
		if (n.hasOwnProperty("value"))
			np.value = n.value;
		if (n.hasOwnProperty("time"))
			np.time = n.time;

		np.listener = [];
		if (n.hasOwnProperty("listener")) {
			np.listener = n.listener.map(function(rentry) {
				return r.get_listener(rentry);
			});
		}

		nodes[name] = np;
	}
	return nodes;
};


/* Get names and data of destinations */
exports.router.prototype.get_dests = function() {
	var dests = [];
	return Object.keys(this.dests);
};


/* Get data of a node */
exports.router.prototype.get = function(name) {
	if (this.nodes.hasOwnProperty(name)) {
		return this.nodes[name];
	}
	return {};
};

exports.router.prototype.register_static_dest = function(name, func) {
	this.dests[name] = func;
};
exports.router.prototype.get_static_dest = function(name) {
	if (this.dests.hasOwnProperty(name)) {
		return this.dests[name];
	}
	return undefined;
};
exports.router.prototype.process_message = function(data, cb_name, obj, respond) {
	var r = this;
	if (typeof respond !== "function")
		respond = function() {};

	if (!Array.isArray(data)) {
		data = [data];

	data.forEach(function(d) {
		if (d.hasOwnProperty('type')) {
			if (d.type == 'bind' && d.hasOwnProperty('node')) {
				var ref = r.register(d.node, cb_name, d.node, obj);

				if (typeof obj !== "undefined" && obj !== null && typeof obj.inform_bind == "function") {
					obj.inform_bind({"node": d.node, "ref": ref});
					//ws.registered_nodes.push({"node": d.node, "ref": ref});
				}
			} else if (d.type == 'list') {
				if (typeof obj !== "undefined" && obj !== null) {
					respond({"type":"dataset", "data":r.get_nodes()});
					//ws.sendjson_save({"type":"dataset", "data":r.get_nodes()});
				}
			} else if (d.type == 'data' && d.hasOwnProperty('node') &&
					d.hasOwnProperty('value') &&
					d.hasOwnProperty('time')) {
				r.route(basename + d.node, d.time, d.value);
			} else if (d.type == 'connect' && d.hasOwnProperty('node') &&
					d.hasOwnProperty('dnode')) {
				r.connect(d.node, d.dnode);
			} else if (d.type == 'register' && d.hasOwnProperty('node') &&
					d.hasOwnProperty('dest')) {
				r.register(d.node, d.dest, d.id, d.obj);
			} else if (d.type == 'unregister' && d.hasOwnProperty('node') &&
					d.hasOwnProperty('rentry')) {
				r.unregister(d.node, d.rentry);
			} else if (d.type == 'get_dests') {
				if (typeof obj !== "undefined" && obj !== null) {
					respond({"type":"dests", "data":r.get_dests()});
					//ws.sendjson_save({"type":"dests", "data":r.get_dests()});
				}
			} else {
				console.log("Router, Process message: Packet with unknown type received: ", d.type,
					" Packet: ", JSON.stringify(d));
			}
		}
	});
};

/* Cue data */
exports.router.prototype.cue = function(callback) {
	var cue_data = [];
	return function(entry) {
		cue_data.push(entry);
		process.nextTick(function() {
			if (cue_data.length > 0) {
				var data = cue_data.splice(0,cue_data.length);
				callback(data);
			}
		});
	};
};

process.on('SIGINT', function() { process.exit(0); });
process.on('SIGTERM', function() { process.exit(0); });
