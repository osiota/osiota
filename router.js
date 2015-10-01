
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

process.on('SIGINT', function() { process.exit(0); });
process.on('SIGTERM', function() { process.exit(0); });
