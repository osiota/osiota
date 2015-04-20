
exports.nodes = {};
exports.dests = {};

exports.register = function(name, ref) {
	console.log("registering " + name);
	if (!exports.nodes.hasOwnProperty(name))
		exports.nodes[name] = [];
	if (!exports.nodes[name].hasOwnProperty("listener")) {
		exports.nodes[name].listener = [];
	}

	exports.nodes[name].listener.push(ref);

	// push data to new entry:
	if (exports.nodes.hasOwnProperty(name) &&
			exports.nodes[name] !== null &&
			exports.nodes[name].hasOwnProperty("value") &&
			exports.nodes[name].hasOwnProperty("time")) {
		exports.route_one(ref, name, exports.nodes[name].time, exports.nodes[name].value);
	}
	return ref;
};
exports.unregister = function(name, ref) {
	console.log("unregistering " + name);
	if (exports.nodes.hasOwnProperty(name) &&
			exports.nodes[name].hasOwnProperty("listener")) {
		for(var j=0; j<exports.nodes[name].listener.length; j++) {
			if (exports.nodes[name].listener[j] === ref) {
				exports.nodes[name].listener.splice(j, 1);
				return;
			}
		}
	}
	console.log("\tfailed.");
};

exports.route_one = function(rentry, name, time, value) {
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
		exports.route(to, time, value);
	} else {
		console.log("TO [" + name + "]: Unknown function:", to);
	}
};

exports.route = function(name, time, value) {
	// is a new node?
	if (!exports.nodes.hasOwnProperty(name)) {
		console.log("new node: " + name);
	}
	// cancel if timestamp did not change:
	var node = exports.nodes[name];
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
			exports.route_one(node.listener[i], name, time, value);
		}
	}
};

exports.get_nodes = function() {
	var data = {};
	for (var name in exports.nodes) {
		if (exports.nodes.hasOwnProperty(name)) {
			var node = exports.nodes[name];
			data[name] = {};
			if (node.hasOwnProperty("value"))
				data[name].value = node.value;
			if (node.hasOwnProperty("time"))
				data[name].time = node.time;
		}
	}

	return data;
};

exports.get = function(name) {
	if (exports.nodes.hasOwnProperty(name)) {
		return exports.nodes[name];
	}
	return {};
};
