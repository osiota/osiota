
exports.router = function() {
	this.nodes = {};
	this.dests = {};
};


exports.router.prototype.register = function(name, ref) {
	console.log("registering " + name);
	if (!this.nodes.hasOwnProperty(name))
		this.nodes[name] = [];
	if (!this.nodes[name].hasOwnProperty("listener")) {
		this.nodes[name].listener = [];
	}

	this.nodes[name].listener.push(ref);

	// push data to new entry:
	if (this.nodes.hasOwnProperty(name) &&
			this.nodes[name] !== null &&
			this.nodes[name].hasOwnProperty("value") &&
			this.nodes[name].hasOwnProperty("time")) {
		this.route_one(ref, name, this.nodes[name].time, this.nodes[name].value);
	}
	return ref;
};
exports.router.prototype.unregister = function(name, ref) {
	console.log("unregistering " + name);
	if (this.nodes.hasOwnProperty(name) &&
			this.nodes[name].hasOwnProperty("listener")) {
		for(var j=0; j<this.nodes[name].listener.length; j++) {
			if (this.nodes[name].listener[j] === ref) {
				this.nodes[name].listener.splice(j, 1);
				return;
			}
		}
	}
	console.log("\tfailed.");
};

exports.router.prototype.route_one = function(rentry, name, time, value) {
	var to = rentry.to;
	var id = rentry.id;
	var f = rentry.f;

	var v = value;
	if (f) {
		v = f(v);
	}
	if (!id || id == "") {
		id = name;
	}
	if (typeof to == "function") {
		to(id, name, time, v);
	} else if (typeof to == "string") {
		// reroute to an other node:
		this.route(to, time, value);
	} else {
		console.log("TO [" + name + "]: Unknown function:", to);
	}
};

exports.router.prototype.route = function(name, time, value) {
	// is a new node?
	if (!this.nodes.hasOwnProperty(name)) {
		console.log("new node: " + name);
		this.nodes[name] = {};
	}
	// cancel if timestamp did not change:
	var node = this.nodes[name];
	if (node.hasOwnProperty("time")) {
		if (node.time == time)
			return;
	}
	// set new data:
	node.value = value;
	node.time = time;

	//console.log("R: " + name + " [" + time + "]:\t" + value);
	//
	if (node.hasOwnProperty("listener")) {
		for(var i=0; i<node.listener.length; i++) {
			this.route_one(node.listener[i], name, time, value);
		}
	}
};

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
