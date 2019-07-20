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

var merge_object = require("./helper.js").merge_object;
var unload_object = require("./helper_unload_object.js").unload_object;
var match = require("./helper_match").match;

var RemoteCall = require('./router_remotecall.js').remotecall;

/**
 * Create a node instance
 * @class
 * @classdesc Node class
 * @mixes remotecall
 * @param {router} r - The router instance
 * @param {string} name - The name of the node
 * @param {node} parentnode - The parent node
 * @hideconstructor
 * @fires router#create_new_node
 */
exports.node = function(r, name, parentnode) {
	this.name = name;
	if (typeof name === "string") {
		this.nodename = name.replace(/^.*([\/@])/, '$1');
	}

	this.router = r;

	/**
	 * Value of the node
	 * @type {*}
	 */
	this.value = null;
	/**
	 * Timestamp of the last change
	 * @type {timestamp}
	 */
	this.time = null;

	/**
	 * Meta data describing the data in the node
	 * @type {object}
	 */
	this.metadata = null;

	this.subscription_listener = [];
	this.announcement_listener = [];
	this.ready_listener = [];

	this.parentnode = parentnode;

	RemoteCall.call(this);

	// subscripbe from remote host:
	var is_subscriped = false;
	var check_need_subscription = function(reinit) {
		if (reinit === true) {
			is_subscriped = false;
		}
		// not a remote node
		if (!this.hasOwnProperty("connection")) {
			return;
		}

		if (is_subscriped) {
			if (this.subscription_listener.length == 0) {
				this.rpc("unsubscribe");
				is_subscriped = false;
			}
		} else {
			if (this.subscription_listener.length > 0) {
				this.rpc("subscribe");
				is_subscriped = true;
			}
		}
	};
	this.on('registered', check_need_subscription);
	this.on('unregistered', check_need_subscription);
	this.on('node_update', check_need_subscription);

	/**
	 * Create new node event
	 *
	 * @event router#create_new_node
	 */
	r.emit('create_new_node', this);
};
util.inherits(exports.node, RemoteCall);
/**
 * Get a node instance
 * @param {string} name - Name of the node
 * @returns {node}
 */
exports.node.prototype.node = function(name) {
	if (name.match(/^\//))
		return this.router.node(name);

	name  = name.replace(/^\.\//, '');

	if (name == "." || name == "")
		return this;

	var is_parent = name.match(/^\.\.\/(.*)$|^\.\.$/);
	if (is_parent && this.parentnode) {
		return this.parentnode.node(is_parent[1] || ".");
	}
	return this.router.node(this.name + "/" + name);
};

/**
 * Create a virtual node for data handling
 * @returns {node}
 */
exports.node.prototype.virtualnode = function() {
	return new exports.node(this, this.name, null);
};

/**
 * Announce a node with meta data
 * @param {object} metadata - Meta data describing the node
 * @param {boolean} update - (For internal use only!)
 * @fires router#announce
 */
exports.node.prototype.announce = function(metadata, update) {
	if (typeof update === "undefined") {
		update = false;
	}
	if (Array.isArray(metadata)) {
		metadata = merge_object({}, metadata);
	}
	if (typeof metadata !== "object" || metadata === null) {
		metadata = {};
	}
	if (this.metadata === null) {
		console.info("new node:", this.name);
		update = false;
	} else if (!update) {
		console.warn("Announcing already available node:", this.name);
		update = true;
	}

	this.metadata = metadata;

	/**
	 * Announce node event
	 *
	 * Give others a chance to alter metadata before annoucing it.
	 *
	 * @event router#announce
	 * @type {node}
	 */
	this.router.emit("announce", this);

	this.announce_local("announce", update);

	return this;
};
/** Unannounce a node */
exports.node.prototype.unannounce = function() {
	if (this.metadata === null)
		return;

	this.publish_sync(null, null, undefined, true);

	this.announce_local("unannounce");

	this.metadata = null;

	return this;
};

/* Announce node (local) */
exports.node.prototype.announce_local = function(method, update) {
	var _this = this;
	this.ready_listener.forEach(function(object) {
		_this.ready_listener_call(object, method, false, update);
	});

	this.announce_climb(this, method, update);
};

/* Announce node (climber) */
exports.node.prototype.announce_climb = function(node, method, update) {
	if (typeof node !== "object" || node === null) {
		node = this;
	}
	var _this = this;
	this.announcement_listener.forEach(function(object) {
		_this.announcement_listener_call(object, node, method,
				false, update);
	});

	// climp to parent:
	if (this.parentnode !== null) {
		this.parentnode.announce_climb(node, method, update);
	}
};

exports.node.prototype.get_nodes = function(basename, children_of_children) {
	return this.router.get_nodes(basename, children_of_children);
};

/* Children of a node */
exports.node.prototype.get_children = function() {
	return this.router.get_nodes(this.name, false);
};

/* Generates metadata based on nodenames */
exports.node.prototype.generate_metadata = function() {
	var metadata = {};
	if (this.name.match(/\.energy\.data$/)) {
		metadata = {
			type: "energy.data",
			unit: "Watt",
			datatype:"float",
			//TODO adding interval?
		};
	} else if (this.name.match(/\.temperature\.data$/)) {
		metadata = {
			type: "temperature.data",
			unit: "°C",
			datatype:"float",
			//TODO adding interval?
		};
	} else if (this.name.match(/\.state\.data$/)) {
		metadata = {
			type: "state.data"
			// no default values yet
		};
	} else if (this.name.match(/\.text\.info$/)) {
		metadata = {
			type: "text.info"
			// no default values yet
		};
	} else {
		var type = this.name.match(/\.([^\/]*)$/);
		if (type) {
			metadata = {
				type: type[1]
			};
		}
	}

	this.announce(metadata);
}

/* add metadata to node-object
 * 	data example: {value:"energy"}
 */
exports.node.prototype.add_metadata = function(data) {
	if (typeof this.metadata !== "object" || this.metadata === null) {
		this.metadata = {};
	}

	if (typeof data === 'object' && data !== null){
		for (var key in data){
			this.metadata[key] = data[key];
		}
	}

	this.announce(this.metadata, true);
}

/*gets metadata of node-object*/
exports.node.prototype.get_metadata = function() {
	return this.metadata;
}

/* create a unique time stamp */
exports.node.prototype.unique_date = function() {
	var d = new Date()/1000;
	if (typeof this._unique_date !== "number" ||
			d - this._unique_date > 0.00005 ||
			d < this._unique_date-1) {
		return this._unique_date = d;
	}
	this._unique_date += 0.00001;
	return this._unique_date;

};

/**
 * Set new data
 * @fires node#set
 * @private
 */
exports.node.prototype.set = function(time, value, only_if_differ, do_not_add_to_history) {
	// convert from string to number:
	if (typeof time === "string")
		time = time*1;

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
	if (only_if_differ &&
			this.value !== null &&
			this.value === value) {
		return false;
	}

	// set new data:
	this.value = value;
	this.time = time;

	/**
	 * set value event
	 *
	 * @event node#set
	 * @param {number} time
	 * @param {*} value
	 * @param {boolean} only_if_differ
	 * @param {boolean} do_not_add_to_history
	 */
	this.emit('set', time, value, only_if_differ, do_not_add_to_history);

	return true;
};

/* Route data (synchronous) */
exports.node.prototype.publish_sync = function(time, value, only_if_differ, do_not_add_to_history, initial) {
	if (typeof time === "undefined")
		time = this.unique_date();

	if (this.set(time, value, only_if_differ, do_not_add_to_history, initial)) {
		this.subscription_notify(do_not_add_to_history, initial);
	}
	return time;
};

/* Route data (asynchronous) */
exports.node.prototype.publish = function(time, value, only_if_differ, do_not_add_to_history, initial) {
	var _this = this;

	if (typeof time === "undefined")
		time = this.unique_date();

	process.nextTick(function() {
		if (_this.set(time, value, only_if_differ, do_not_add_to_history, initial)) {
			_this.subscription_notify(do_not_add_to_history, initial);
		}
	});

	return time;
};

/* Route data object (asynchronous) */
exports.node.prototype.publish_obj = function(object) {
	if (typeof object !== "object")
		throw new Error("publish_obj: argument is not an object: "+
			typeof object);

	return this.publish(object.time, object.value,
			object.only_if_differ, object.do_not_add_to_history);
};

/* Route data array (asynchronous) */
exports.node.prototype.publish_all = function(data, step, done, offset) {
	if (typeof offset !== "number") {
		offset = 0;
	}
	var slots = 10000;
	var i = offset;
	var n = Math.min(offset+slots, data.length);
	for (; i < n; i++) {
		this.publish_obj(data[i]);
	}
	if (i >= data.length) {
		if (typeof done === "function")
			process.nextTick(done);
	} else {
		console.log("time", data[i].time);
		var tid = setTimeout(this.publish_all.bind(this),
				0,
				data, step, done, n);
		if (typeof step === "function")
			step(tid);
	}
};

/* Route data (give a callback to subscribe) */
exports.node.prototype.publish_subscribe_cb = function() {
	var dnode = this;
	return function(do_not_add_to_history, initial) {
		dnode.publish(this.time, this.value, undefined,
				do_not_add_to_history);
	};
};

/* DEPRECATED: Register a link name for a route */
exports.node.prototype.connect = function(dnode, metadata) {
	var _this = this;
	if (Array.isArray(dnode)) {
		return dnode.map(function(dn) {
			return _this.connect(dn);
		});
	}
	if (typeof dnode === "string") {
		dnode = this.node(dnode);
	}
	if (typeof dnode !== "object" && dnode !== null) {
		throw new Error("dnode is not a node");
	}

	console.info("connecting " + this.name + " to " + dnode.name);

	if (typeof metadata !== "object") {
		metadata = this.metadata;
	}

	dnode.announce(metadata);
	var s = this.subscribe(dnode.publish_subscribe_cb());

	return function() {
		s.remove();
		dnode.unannounce();
	};
};

/**
 * Subscribe to the changes of a node
 * @param {node~subscribeCallback} object - The function to be called on new data
 * @fires node#registered
 * @this node
 */
exports.node.prototype.subscribe = function(callback) {
	// Save the time when this entry was added
	var object = callback.bind(this);
	object.time_added = new Date();

	this.subscription_listener.push(object);
	/**
	 * registered subscription event
	 *
	 * @event node#registerd
	 * @type {function}
	 */
	this.emit("registered", object);

	if (this.time != null)
		object.call(this, true, true);

	object.remove = this.unsubscribe.bind(this, object);

	return object;
};

/**
 * Callback to be used when subscribing a node
 * @callback node~subscribeCallback
 * @param {boolean} do_not_add_to_history - Shall this new entry be added to the history?
 * @param {boolean} initial - Is called initialy?
 */


/**
 * Unsubscribe to the changes of a node
 * @param {function} object - The function to be unsubscribed
 * @fires node#unregistered
 */
exports.node.prototype.unsubscribe = function(object) {
	for(var j=0; j<this.subscription_listener.length; j++) {
		if (this.subscription_listener[j] === object) {
			var r = this.subscription_listener.splice(j, 1);
			/**
			 * unregistered subscription event
			 *
			 * @event node#unregisterd
			 * @type {function}
			 */
			this.emit("unregistered", r[0]);
			return true;
		}
	}
	throw new Error("unsubscription failed: " + this.name);
};

/* Notify the subscriptions */
exports.node.prototype.subscription_notify = function(do_not_add_to_history, initial) {
	if (typeof do_not_add_to_history === "undefined") {
		do_not_add_to_history = false;
	}

	var _this = this;
	this.subscription_listener.forEach(function(f) {
		f.call(_this, do_not_add_to_history, initial);
	});
};

/**
 * Subscribe to announcements
 * @param {string} filter_method - Only listen to a specific method
 * @param {function} object - The function to be called an new announcements
 */
exports.node.prototype.subscribe_announcement = function(filter_method, callback){
	var object;
	if (typeof filter_method === "function") {
		object = filter_method.bind(this);;
		filter_method = null;
	} else {
		object = callback.bind(this);
	}

	// Save the time when this entry was added
	object.time_added = new Date();

	// Add the filter option
	object.filter_method = filter_method;

	// Add to listener array
	this.announcement_listener.push(object);

	if (this.metadata !== null)
		this.announcement_listener_call(object, this, "announce", true);

	// get data of childs:
	var allchildren = this.router.get_nodes(this.name);
	for(var childname in allchildren) {
		var nc = allchildren[childname];
		if (nc !== this && nc.metadata !== null) {
			this.announcement_listener_call(object, nc,
					"announce", true);
		}
	}

	object.remove = this.unsubscribe_announcement.bind(this, object);

	return object;
};

/**
 * Unsubscribe announcements
 * @param {function} object - The function to be unsubscribed
 */
exports.node.prototype.unsubscribe_announcement = function(object) {
	for(var j=0; j<this.announcement_listener.length; j++) {
		if (this.announcement_listener[j] === object) {
			// remove listener:
			this.announcement_listener.splice(j, 1);

			// call listener with method remove:
			this.announcement_listener_call(object, this,
					"remove", true);

			// call childen with method remove:
			var allchildren = this.router.get_nodes(this.name);
			for(var childname in allchildren) {
				var nc = allchildren[childname];
				if (nc !== this && nc.metadata !== null) {
					this.announcement_listener_call(object,
							nc, "remove", true);
				}
			}

			return true;
		}
	}
	throw new Error("unsubscription of announcements failed: " + this.name);
};

/*
 * Internal function:
 * Call a announcement listener
 */
exports.node.prototype.announcement_listener_call = function(object, node,
			method, initial, update) {
	var o = null;
	if (typeof object.filter_method !== "string" ||
			object.filter_method === method) {
		o = object.call(this, node, method, initial, update);
	}
	if (method === "announce") {
		if (o) {
			if (typeof object._object != "object") {
				object._object = {};
			}
			if (object._object[node.name]) {
				unload_object(object._object[node.name]);
			}
			object._object[node.name] = o;
		}
	} else {
		if (typeof object._object == "object" &&
				object._object[node.name]) {
			unload_object(object._object[node.name]);
			delete object._object[node.name];
		}
	}
};


/**
 * Subscribe ready listener
 * @param {string} filter_method - Only listen to a specific method
 * @param {function} object - The function to be called an ready
 */
exports.node.prototype.ready = function(filter_method, callback) {
	var object;
	if (typeof filter_method === "function") {
		object = filter_method.bind(this);
		filter_method = null;
	} else {
		object = callback.bind(this);
	}
	// Save the time when this entry was added
	object.time_added = new Date();

	// Add the filter option
	object.filter_method = filter_method;

	// Add to listener array
	this.ready_listener.push(object);

	if (this.metadata !== null)
		this.ready_listener_call(object, "announce", true);

	object.remove = this.ready_remove.bind(this, object);

	return object;
};

/**
 * Unsubscribe ready listener
 * @param {function} object - The function to be unsubscribed
 */
exports.node.prototype.ready_remove = function(object) {
	for(var j=0; j<this.ready_listener.length; j++) {
		if (this.ready_listener[j] === object) {
			this.ready_listener.splice(j, 1);
			this.ready_listener_call(object, "remove", true);
			return true;
		}
	}
	throw new Error("unsubscription of ready failed: " + this.name);
};

/*
 * Internal function:
 * Call a ready listener
 */
exports.node.prototype.ready_listener_call = function(object, method,
			initial, update) {
	var o = null;
	if (typeof object.filter_method !== "string" ||
			object.filter_method === method) {
		o = object.call(this, method, initial, update);
	}
	if (method === "announce") {
		object._object = o;
	} else {
		if (object._object) {
			unload_object(object._object);
			object._object = null;
		}
	}
};


/**
 * Is parent a parent node of this node?
 * @param {node} parent - The parent node
 */
exports.node.prototype.is_parentnode = function(parent) {
	if(parent == this || parent == this.name)
		return 0;
	if (this.parentnode !== null) {
		var r = this.parentnode.is_parentnode(parent);
		if (r >= 0)
			return r+1;
	}
	return -1;
}

exports.node.prototype.relative_path = function(to) {
	var components_to = to.name.split(/\//);
	var components_from = this.name.split(/\//);

	var components_new = [];
	var found = false;
	components_to.forEach(function(c, i) {
		if (!found) {
			if (components_from.length <= i) {
				found = true;
			} else if (components_from[i] !== c) {
				found = true;
				for (var j=i; j<components_from.length; j++) {
					components_new.push("..");
				}
			}
		}
		if (found) {
			components_new.push(c);
		}
	});
	if (!found) {
		var i = components_to.length-1;
		for (var j=i; j<components_from.length-1; j++) {
			components_new.push("..");
		}
	}

	return components_new.join("/");
};

/**
 * Filter nodes (like subscribe_announcement but with filtering)
 * @param {object} filter_config - An object with the filter configuration
 * @param {string} filter_method - Only listen to a specific method
 * @param {function} object - The function to be called an new announcements
 */
exports.node.prototype.filter = function(filter_config, filter_method,
							callback) {
	if (typeof filter_method === "function") {
		callback = filter_method;
		filter_method = null;
	}
	if (typeof callback !== "function") {
		throw new Error("filter: callback is not a function");
	}
	return this.subscribe_announcement(filter_method, function(node,
				method, initial, update) {
		var f = this.filter_node(filter_config, node);
		if (f) {
			return callback.call(this, node, method, initial,
					update, f);
		}
	});
};

/**
 * Check filter config on an node (relative to this node)
 * @param {object} filter_config - An object with the filter configuration
 * @param {node} node - Node to filter
 * @private
 */
exports.node.prototype.filter_node = function(filter_config, node) {
	// default: filter nothing:
	if (typeof filter_config === "undefined" || filter_config === null)
		return true;

	if (typeof filter_config === "object" &&
			Array.isArray(filter_config)) {
		for (var k in filter_config) {
			if (filter_config.hasOwnProperty(k)) {
				var r = this.filter_node(filter_config[k],
						node);
				if (r) {
					return r;
				}
			}
		}
		return false;
	}

	// FILTER
	// * by nodes
	if (typeof filter_config.nodes === "object" &&
			Array.isArray(filter_config.nodes) &&
			filter_config.nodes.length) {
		// TODO: implement with WeekMap
		if (filter_config.nodes.indexOf(node.name) <= -1) {
			return false;
		}
	}

	// * by depth
	if (typeof filter_config.depth === "number" &&
			filter_config.depth > 0) {
		var l = node.is_parentnode(this);
		if (l > filter_config.depth) {
			return false;
		}
	}

	// * by metadata
	if (typeof filter_config.metadata === "object" &&
			Object.keys(filter_config.metadata).length &&
			!match(node.metadata,
				filter_config.metadata)) {
		return false;
	}

	return filter_config;
};

/* Remote procedure calls */
exports.node.prototype.rpc_data = function(reply, time, value, only_if_differ, do_not_add_to_history, initial) {
	this.publish(time, value, only_if_differ, do_not_add_to_history, initial);
	reply(null, "okay");
};
exports.node.prototype.rpc_connect = function(reply, dnode) {
	var rentry = this.connect(dnode);
	reply(null, rentry);
};

/**
 * Register a RPC command on the node
 * @param {string} method - Method to be called
 * @param {function} callack - Function to register
 */
exports.node.prototype.on_rpc = function(method, callback) {
	var _this = this;

	if (typeof method !== "string")
		throw new Error("on_rpc: method is not a string");
	if (typeof callback !== "function")
		throw new Error("on_rpc: callback is not a function");
	this["rpc_" + method] = callback;

	return function() {
		_this["rpc_" + method] = undefined;
	}
};

/**
 * Execute a RPC command on the node
 * @param {string} method - Method to be called
 * @param {...*} args - Extra arguments
 * @param {function} [callback] - Callback to get the result
 */
exports.node.prototype.rpc = function(method) {
	var _this = this;
	if (!this.hasOwnProperty("connection")) {
		var args = Array.prototype.slice.call(arguments);
		//var method =
		args.shift();

		var callback = null;
		if (typeof args[args.length-1] === "function") {
			callback = args.pop();
			reply = callback.bind(_this);
		} else {
			reply = function(error, data) {
				if (error !== null) {
					console.error("RPC(local)-Error: ", error, data);
				}
			}
		}

		try {
			if (this._rpc_process(method, args, reply)) {
				return;
			}
			else if (this._rpc_process("node_" + method, args,
						reply, this.router)) {
				return;
			}
			throw new Error("method not found:" + method);
		} catch (e) {
			console.warn("Router, process local rpc:\n",
				e.stack || e);
			reply("Exception:", (e.stack || e).toString());
		}
	} else {
		var ws = this.connection;

		var args = Array.prototype.slice.call(arguments);

		// Add node object to arguments:
		args.unshift(this);
		if (ws !== null)
			ws.node_rpc.apply(ws, args);
	}
};

/* Overwrite function to convert object to string: */
exports.node.prototype.toJSON = function() {
	var n = {};
	n.value = this.value;
	n.time = this.time;

	// stringify ??
	return n;
};




/**
 * Creates a Router instance
 * @class
 * @classdesc Router class
 * @param {string} [name] - The name of the router
 */
exports.router = function(name) {
	this.nodes = {};

	this.name = "energy-router";
	if (typeof name === "string")
		this.name = name;

	RemoteCall.call(this);
};
util.inherits(exports.router, RemoteCall);

/* Route data */
exports.router.prototype.publish = function(name, time, value, only_if_differ, do_not_add_to_history) {
	var n = this.node(name);
	n.publish(time, value, only_if_differ, do_not_add_to_history);
}


/* Get names and data of the nodes */
exports.router.prototype.get_nodes = function(basename, children_of_children) {
	if (typeof basename !== "string") basename = "";
	if (basename === "/") basename = "";
	if (typeof children_of_children === "undefined") children_of_children = true;

	var nodes = {};
	var _this = this;

	// Sort keys:
	Object.keys(this.nodes).sort().forEach(function(name) {
		var n = _this.nodes[name];

		// Filter nodes:
		var regex = new RegExp("^" + RegExp.quote(basename) + "(/.*)$", '');
		if (!children_of_children) {
			// only direct children:
			regex = new RegExp("^" + RegExp.quote(basename) + "(/[^/@]*)$", '');
		}
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
	return r;
};


/**
 * Get a node instance
 * @param {string} name - Name of the node
 * @returns {node}
 */
exports.router.prototype.node = function(name) {
	if (typeof name === "object") return name;

	name = "/" + name;
	name = name.replace(/\/{2,}/, "/");

	if (this.nodes.hasOwnProperty(name)) {
		return this.nodes[name];
	}

	// get parent node:
	var parentnode = null;
	if (name == "/") {
		parentnode = null;
	} else {
		if (name.match(/[\/@]/)) {
			var parentname = name.replace(/[\/@][^\/@]*$/, "");
			parentnode = this.node(parentname);
		} else {
			parentnode = this.node("/");
		}
	}
	// create new node:
	this.nodes[name] = new exports.node(this, name, parentnode);
	return this.nodes[name];
};

/* Remote procedure calls */
exports.router.prototype.rpc_ping = function(reply) {
	reply(null, "ping");
};
exports.router.prototype.rpc_list = function(reply) {
	reply(null, this.nodes);
};

/* process a single command message */
exports.router.prototype.process_single_message = function(basename, d, respond, module) {
	var rpc_ref = d.ref;
	var reply = function(error, data) {
		var args = Array.prototype.slice.call(arguments);
		if (typeof rpc_ref !== "undefined") {
			if (typeof error === "undefined") {
				//error = null;
				args[0] = null;
			}
			args.unshift(rpc_ref);
			respond({"scope": "respond", "type": "reply",
				"args": args});
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

			if(this.hasOwnProperty('policy_checker')) {
				var policy_checker = this.policy_checker;
				// checks if the remote is allowed
				// to perform this method on this node
				var policy = policy_checker.check(n,
					module.wpath, method, 'from_remote');

				// react respectively to the policy-action
				// if a policy was found
				if (policy != null &&
					policy.action == 'preprocess_value') {

					// aggregating data of group of nodes
					if (policy.action_extra.hasOwnProperty('group')) {
						throw new Error("Blocked by Policy-Management");
					}

					// aggregating data of requested node
					d.args = [ policy ];
					method ='subscribe_for_aggregated_data';
				}
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
		console.warn("Router, process_single_message:\n",
				e.stack || e);
		console.warn("Packet: "+ JSON.stringify(d));
		reply("Exception:", (e.stack || e).toString());
	}
};

/* process command messages (ie from websocket) */
exports.router.prototype.process_message = function(basename, data, respond, module) {
	var r = this;
	if (typeof respond !== "function")
		respond = function() {};

	if (!Array.isArray(data)) {
		data = [data];
	}

	data.forEach(function(d) {
		r.process_single_message(basename, d, respond, module);

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
				console.warn("Exception (Router, cue):",
						e.stack || e);
			}
		});
	};
};
/* Cue data, getter */
exports.router.prototype.cue_getter = function(callback) {
	var cue_data = [];
	var processing = false;
	return function(entry) {
		if (cue_data.length > 100000) {
			console.warn("Cue data exceeding limit of 100 000 entries. Is your processing function broken? Flushing cue to avoid memory overflow.");
			cue_data = [];
			return;
		}
		cue_data.push(entry);
		process.nextTick(function() {
			try {
				if (cue_data.length > 0 && !processing) {
					processing = true;
					callback(function(err) {
						processing = false;
						if (err) {
							return;
						}
						var data = cue_data.splice(0,cue_data.length);
						return data;
					});
				}
			} catch (e) {
				console.warn("Exception (Router, cue):",
						e.stack || e);
				processing = false;
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
			console.warn("Exception (Router, nocue):",
					e.stack || e);
		}
	};
};

exports.router.prototype.nodename_transform = function(nodename, basename_add, basename_remove) {
	if (typeof basename_remove === "string") {
		var regex = new RegExp("^" + RegExp.quote(basename_remove) + "(/.*)?$", '');
		var found = nodename.match(regex)
		if (found) {
			nodename = found[1];
			if (typeof nodename !== "string")
				nodename = "/";
		} else {
			throw new Error("nodename_transform: Basename not found: " + basename_remove + " (node: " + nodename + ")");
		}
	}
	if (typeof basename_add === "string") {
		if (nodename == "/") {
			nodename = basename_add;
		} else {
			nodename = basename_add + nodename;
		}
	}

	return nodename;
}

