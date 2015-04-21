
/* Class: Router */
exports.router = function() {
	this.nodes = {};
	this.dests = {};
};


/* Register a callback or a link name for a route */
exports.router.prototype.register = function(name, ref, id, rentry) {
	console.log("registering " + name);
	if (!this.nodes.hasOwnProperty(name))
		this.nodes[name] = [];
	if (!this.nodes[name].hasOwnProperty("listener")) {
		this.nodes[name].listener = [];
	}

	// Get or create the rentry object:
	if (typeof rentry !== "object") {
		if (typeof id === "object") {
			rentry = id;
			id = undefined;
		}
		else if (typeof ref === "object") {
			rentry = ref;
			ref = undefined;
		} else {
			rentry = {};
		}
	} else {
		rentry = {};
	}

	// Set ref:
	if (typeof ref !== "undefined") {
		rentry.to = ref;
	}

	// Set id:
	if (!rentry.hasOwnProperty("id") || !rentry.id || rentry.id == "") {
		rentry.id = name;
	}
	if (typeof id !== "undefined") {
		rentry.id = id;
	}


	// Check rentry:
	if (typeof rentry.to !== "function" && typeof rentry.to !== "string") {
		console.log("Register: Error, unknown ref type.");
		return false;
	}

	// Save the time when this entry was added
	rentry.time_added = new Date();

	// add routing entry
	this.nodes[name].listener.push(rentry);

	// push data to new entry:
	if (this.nodes.hasOwnProperty(name) &&
			this.nodes[name] !== null &&
			this.nodes[name].hasOwnProperty("value") &&
			this.nodes[name].hasOwnProperty("time")) {
		this.route_one(rentry, name, this.nodes[name].time, this.nodes[name].value);
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
			}
		}
	}
	console.log("\tfailed.");
};

/* Route a single routing entry */
exports.router.prototype.route_one = function(rentry, name, time, value) {
	var to = rentry.to;
	var id = rentry.id;

	if (typeof to == "function") {
		to(id, name, time, value, rentry);
	} else if (typeof to == "string") {
		// reroute to an other node:
		this.route(to, time, value, rentry);
	} else {
		console.log("TO [" + name + "]: Unknown function:", to);
	}
};

/* Route data */
exports.router.prototype.route_synchronous = function(name, time, value) {
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
	// set new data:
	node.value = value;
	node.time = time;

	// route the data according to the routing entries:
	if (node.hasOwnProperty("listener")) {
		for(var i=0; i<node.listener.length; i++) {
			this.route_one(node.listener[i], name, time, value);
		}
	}
};

/* Route data */
exports.router.prototype.route = function(name, time, value) {
	var r = this;
	process.nextTick(function() {
		r.route_synchronous(name, time, value);
	});
}


/* Get names and data of the nodes */
exports.router.prototype.get_nodes = function() {
	var data = {};
	for (var name in this.nodes) {
		if (this.nodes.hasOwnProperty(name)) {
			var node = this.nodes[name];
			data[name] = {};
			if (node.hasOwnProperty("value"))
				data[name].value = node.value;
			if (node.hasOwnProperty("time"))
				data[name].time = node.time;
		}
	}

	return data;
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
