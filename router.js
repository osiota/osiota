
//var binarysearch = require("binary-search");

RegExp.quote = function(str) {
	    return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
};


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

	// add history:
	if (typeof do_not_add_to_history === "undefined" ||
			!do_not_add_to_history) {
		this.history.add({value: value, time: time});
	}

	return true;
};
/* Route data */
exports.node.prototype.route = function(r, name, time, value, relative_name, do_not_add_to_history) {
	// route the data according to the routing entries:
	if (this.hasOwnProperty("listener")) {
		for(var i=0; i<this.listener.length; i++) {
			this.route_one(r, this.listener[i], name, time, value, relative_name, do_not_add_to_history);
		}
	}
	this.route_parent(r, name, time, value, relative_name, do_not_add_to_history);
};
/* Route data (synchronous) */
exports.node.prototype.publish_sync = function(r, time, value, only_if_differ, do_not_add_to_history) {
	if (this.set(time, value, only_if_differ, do_not_add_to_history)) {
		this.route(r, name, time, value, do_not_add_to_history);
	}
};

/* Route data (asynchronous) */
exports.node.prototype.publish = function(r, time, value, only_if_differ, do_not_add_to_history) {
	process.nextTick(function() {
		this.publish_sync(r, time, value, only_if_differ, do_not_add_to_history);
	});
};

/* Route data by a single routing entry */
exports.node.prototype.route_one = function(r, rentry, name, time, value, relative_name, do_not_add_to_history) {
	if (typeof relative_name === "undefined") {
		relative_name = "";
	}
	if (typeof do_not_add_to_history === "undefined") {
		do_not_add_to_history = false;
	}

	if (typeof rentry.type === "string") {
		if (rentry.type == "function" && typeof rentry.dest === "string") {
			var dest_f = r.get_static_dest(rentry.dest);
			//dest_f(rentry.id, time, value, name, rentry.obj,
			dest_f.call(this, rentry.id, time, value, name, rentry.obj,
					relative_name, do_not_add_to_history);
		} else if (rentry.type == "node" && typeof rentry.dnode === "string") {
			r.route(rentry.dnode + relative_name, time, value, do_not_add_to_history);
		} else {
			console.log("Route [" + name + "]: Unknown destination type: ", rentry.type);
		}
	}
};

/* Inform parent node about new data */
exports.node.prototype.route_parent = function(r, name, time, value, relative_name, do_not_add_to_history) {
	if (typeof relative_name === "undefined") {
		relative_name = "";
	}

	if (this.parentnode !== null) {
		this.parentnode.route(r, name, time, value, this.nodename + relative_name, do_not_add_to_history);
	}
};

/* Add a routing entry */
exports.node.prototype.add_rentry = function(r, rentry, push_data) {
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
		this.route_one(r, rentry, this.name, this.time, this.value);

		// get data of childs:
		var allchildren = r.get_nodes(this.name);
		for(var childname in allchildren) {
			var nc = allchildren[childname];
			nc.route_one(r, rentry, childname, nc.time, nc.value);
		}
	}

	return rentry;
};

/* Register a callback or a link name for a route */
exports.node.prototype.register = function(r, dest, id, obj, push_data) {
	console.log("registering " + this.name);

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

	return this.add_rentry(r, rentry, push_data);
};


/* Register a link name for a route */
exports.node.prototype.connect = function(r, dnode) {
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

	return this.add_rentry(r, rentry);
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

/* get History of a node: */
exports.node.prototype.get_history = function(interval) {
	if (this.hasOwnProperty('history')) {
		return this.history.get();
	}
	return [];
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
};

/* Register a callback or a link name for a route */
exports.router.prototype.register = function(name, dest, id, obj, push_data) {
	var n = this.get(name, true);
	return n.register(this, dest, id, obj, push_data);
};

/* Register a link name for a route */
exports.router.prototype.connect = function(name, dnode) {
	var n = this.get(name, true);
	return n.connect(this, dnode);
};

/* Register multiple connections */
exports.router.prototype.connectArray = function(nodes) {
	for (var from in nodes) {
		this.connect(from, nodes[from]);
	}

};

/* Delete a routing entry */
exports.router.prototype.unregister = function(name, rentry) {
	var n = this.get(name);
	return n.unregister(rentry);
};

/* Route data */
exports.router.prototype.route = function(name, time, value, only_if_differ, do_not_add_to_history) {
	var r = this;
	var n = this.get(name, true);
	n.publish(this, time, value, only_if_differ, do_not_add_to_history);
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
		var regex = new RegExp("^" + RegExp.quote(basename) + "(.+)$", '');
		if (name.match(regex)) {
			nodes[name] = n;
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
exports.router.prototype.get = function(name, create_new_node) {
	if (name == "") name = "/";

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

/* set function for destination name */
exports.router.prototype.register_static_dest = function(name, func) {
	this.dests[name] = func;
};
/* get function for destination name */
exports.router.prototype.get_static_dest = function(name) {
	if (this.dests.hasOwnProperty(name)) {
		return this.dests[name];
	}
	return undefined;
};
/* process command messages (ie from websocket) */
exports.router.prototype.process_message = function(basename, data, cb_name, obj, respond) {
	var r = this;
	if (typeof respond !== "function")
		respond = function() {};

	if (!Array.isArray(data)) {
		data = [data];
	}

	data.forEach(function(d) {
		if (d.hasOwnProperty('type')) {
			if (d.hasOwnProperty('node')) {
				var n = this.get(basename + name, true);
				if (d.type == 'bind') {
					var ref = n.register(r, cb_name, d.node, obj);

					if (typeof obj !== "undefined" && obj !== null && typeof obj.inform_bind == "function") {
						obj.inform_bind(d.node, ref);
						//ws.registered_nodes.push({"node": d.node, "ref": ref});
					}
				} else if (d.type == 'data' &&
						d.hasOwnProperty('value') &&
						d.hasOwnProperty('time')) {
					n.publish(r, d.time, d.value);
				} else if (d.type == 'connect' &&
						d.hasOwnProperty('dnode')) {
					n.connect(r, d.dnode);
				} else if (d.type == 'register' &&
						d.hasOwnProperty('dest')) {
					n.register(r, d.dest, d.id, d.obj);
				} else if (d.type == 'unregister' &&
						d.hasOwnProperty('rentry')) {
					n.unregister(d.rentry);
				} else if (d.type == 'get_history' &&
						d.hasOwnProperty('interval')) {
					respond({"type": "history", "node": d.node, "data": n.get_history(d.interval) });
				} else {
					console.log("Router, Process message: Packet with unknown (node) command received: ", d.type,
						" Packet: ", JSON.stringify(d));
				}
			} else if (d.type == 'list') {
				respond({"type":"dataset", "data":r.nodes});
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
/* direct data processing without cue */
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
/* history: add new data */
exports.history.prototype.add = function(value) {
	this.history_data.push(value);
	if (this.history_data.length > this.history_length) {
		this.history_data.splice(0,1);  // remove the first element of the array
	}
};
/* history: get old data */
exports.history.prototype.get = function(interval) {
	var config = {};
	config.maxentries = 3000;
	config.samplerate = null;
	config.fromtime = null;
	config.totime = null; // not included.

	// read config from interval object
	if (typeof config !== "object") {
		config = {};
	}
	/*
	for (var configname in config) {
		if (interval.hasOwnProperty(configname) &&
				typeof interval[configname] === "number") {
			config[configname] = interval[configname];
		}
	}
	*/
	var data = this.history_data;
	/*
	if (config.fromtime !== null) {
		var index = Math.abs(
				binarysearch(data, config.fromtime, function(a, b) { return a - b; })
		);
		data = data.slice(index);
	}
	if (config.totime !== null) {
		var index = Math.abs(
				binarysearch(data, config.totime, function(a, b) { return a - b; })
		);
		data = data.slice(0,index);
	}
	*/
	data = data.slice(Math.max(data.length - config.maxentries, 0));
	return data;
}

/* on signal: end the process */
process.on('SIGINT', function() { process.exit(0); });
process.on('SIGTERM', function() { process.exit(0); });

