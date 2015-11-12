
/* Class: Node */
exports.node = function(name, parentnode) {
	this.name = name;
	if (typeof name === "string") {
		this.nodename = name.replace(/^.*([\/@])/, '$1');
	}

	this.value = null;
	this.time = null;

	this.listener = [];

	this.history = new exports.history(50*60);

	this.parentnode = parentnode;

	console.log("new node: " + name);
};
exports.node.prototype.set = function(time, value, only_if_differ) {
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

	// add history:
	this.history.add({value: value, time: time});

	return true;
};
exports.node.prototype.route = function(r, name, time, value, relative_name) {
	// route the data according to the routing entries:
	if (this.hasOwnProperty("listener")) {
		for(var i=0; i<this.listener.length; i++) {
			r.route_one(this.listener[i], name, time, value, relative_name);
		}
	}
	this.route_parent(r, name, time, value, relative_name);
};
exports.node.prototype.route_parent = function(r, name, time, value, relative_name) {
	if (typeof relative_name === "undefined") {
		relative_name = "";
	}

	if (this.parentnode !== null) {
		this.parentnode.route(r, name, time, value, this.nodename + relative_name);
	}
};




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
	console.log("connecting " + name + " to " + dnode);

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

	var n = this.get(name, true);
	if (!n.hasOwnProperty("listener")) {
		n.listener = [];
	}

	// Save the time when this entry was added
	rentry.time_added = new Date();

	// add routing entry
	n.listener.push(rentry);

	// push data to new entry:
	if (push_data) {
		this.route_one(rentry, name, n.time, n.value);
	}

	return rentry;
};

/* Delete a routing entry */
exports.router.prototype.unregister = function(name, rentry) {
	console.log("unregistering " + name);
	var n = this.get(name);
	if (n.hasOwnProperty("listener")) {
		for(var j=0; j<n.listener.length; j++) {
			if (n.listener[j] === rentry) {
				n.listener.splice(j, 1);
				return;
			} else if (n.listener[j].type === "node" &&
					n.listener[j].dnode === rentry.dnode) {
				n.listener.splice(j, 1);
				return;
			}
		}
	}
	console.log("\tfailed.");
};

/* Route a single routing entry */
exports.router.prototype.route_one = function(rentry, name, time, value, relative_name) {
	if (typeof relative_name === "undefined") {
		relative_name = "";
	}

	if (typeof rentry.type === "string") {
		if (rentry.type == "function" && typeof rentry.dest === "string") {
			var dest_f = this.get_static_dest(rentry.dest);
			dest_f(rentry.id, time, value, name, rentry.obj,
					relative_name);
		} else if (rentry.type == "node" && typeof rentry.dnode === "string") {
			this.route(rentry.dnode + relative_name, time, value);
		} else {
			console.log("Route [" + name + "]: Unknown destination type: ", rentry.type);
		}
	}
};

/* Route data */
exports.router.prototype.route_synchronous = function(name, time, value, only_if_differ) {
	var n = this.get(name, true);
	if (n.set(time, value, only_if_differ)) {
		n.route(this, name, time, value);
	}
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
		np.value = n.value;
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
exports.router.prototype.get = function(name, create_new_node) {
	if (name == "") name = "/";
	//console.log("get: ", name);
	if (this.nodes.hasOwnProperty(name)) {
		return this.nodes[name];
	}
	if (typeof create_new_node !== "undefined" && create_new_node === true) {
		// get parent node:
		var parentnode = null;
		if (!name.match(/^[\/@]*$/)) {
			var parentname = name.replace(/[\/@][^\/@]*$/, "");
			parentnode = this.get(parentname, true);
		}
		this.nodes[name] = new exports.node(name, parentnode);
		return this.nodes[name];
	}
	//throw new Exception("node not found.");
	return new exports.node(null);
};

/* get History of a node: */
exports.router.prototype.get_history = function(name, interval) {
	var n = this.get(name);
	if (n.hasOwnProperty('history')) {
		return n.history.get();
	}
	return [];
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
exports.router.prototype.process_message = function(basename, data, cb_name, obj, respond) {
	var r = this;
	if (typeof respond !== "function")
		respond = function() {};

	if (!Array.isArray(data)) {
		data = [data];
	}

	data.forEach(function(d) {
		if (d.hasOwnProperty('type')) {
			if (d.type == 'bind' && d.hasOwnProperty('node')) {
				var ref = r.register(d.node, cb_name, d.node, obj);

				if (typeof obj !== "undefined" && obj !== null && typeof obj.inform_bind == "function") {
					obj.inform_bind(d.node, ref);
					//ws.registered_nodes.push({"node": d.node, "ref": ref});
				}
			} else if (d.type == 'list') {
				respond({"type":"dataset", "data":r.get_nodes()});
				//ws.sendjson_save({"type":"dataset", "data":r.get_nodes()});
			} else if (d.type == 'data' && d.hasOwnProperty('node') &&
					d.hasOwnProperty('value') &&
					d.hasOwnProperty('time')) {
				r.route(basename + d.node, d.time, d.value);
			} else if (d.type == 'get_history' && d.hasOwnProperty('node') &&
					d.hasOwnProperty('interval')) {
				respond({"type": "history", "node": d.node, "data": r.get_history(d.node, d.interval) });
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
				respond({"type":"dests", "data":r.get_dests()});
			// TODO:
			} else if (d.type == 'dataset' && d.hasOwnProperty('data')) {
				for (var node in d.data) {
					console.log("node: ", node);
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
exports.router.prototype.no_cue = function(callback) {
	return function(data) {
		callback(data);
	};
};

/* history */
exports.history = function(history_length) {
	this.history_length = history_length;
	this.history_data = [];
};
exports.history.prototype.add = function(value) {
	this.history_data.push(value);
	if (this.history_data.length > this.history_length) {
		this.history_data.splice(0,1);  // remove the first element of the array
	}
};
exports.history.prototype.get = function(interval) {
	return this.history_data;
}

process.on('SIGINT', function() { process.exit(0); });
process.on('SIGTERM', function() { process.exit(0); });
