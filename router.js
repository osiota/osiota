
exports.data = {};
exports.dests = {};

var route_to = {};

exports.register = function(name, ref) {
	console.log("registering " + name);
	if (!route_to.hasOwnProperty(name))
		route_to[name] = [];

	route_to[name].push(ref);

	// push data to new entry:
	if (exports.data.hasOwnProperty(name) &&
			exports.data[name] !== null) {
		exports.route_one(ref, name, 0, exports.data[name]);
	}
	return ref;
};
exports.unregister = function(name, ref) {
	console.log("unregistering " + name);
	if (route_to.hasOwnProperty(name)) {
		for(var j=0; j<route_to[name].length; j++) {
			if (route_to[name][j] === ref) {
				route_to[name].splice(j, 1);
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
	if (!exports.data.hasOwnProperty(name)) {
		console.log("new node: " + name);
	}
	exports.data[name] = value;

	//console.log("R: " + name + " [" + time + "]:\t" + value);
	if (route_to.hasOwnProperty(name)) {
		for(var i=0; i<route_to[name].length; i++) {
			exports.route_one(route_to[name][i], name, time, value);
		}
	}
};

