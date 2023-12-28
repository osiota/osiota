/*
 * DATA BROKER
 * A nodejs service to handle, subscribe and push data.
 *
 * Simon Walz, IfN, 2015
 */

var json_validate = require("./helper_json_validate.js").json_validate;
var util = require('util');

/* Helper: */
RegExp.quote = function(str) {
	    return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
};

var rpcstack_init = require("./rpc_stack.js").rpcstack_init;
var merge_object = require("./helper.js").merge_object;
var merge = require("./helper_merge_data.js").merge;
var unload_object = require("unload-object").unload;
var match = require("./helper_match").match;
var nodename_transform = require("./helper_nodenametransform").nodename_transform;

var EventEmitter = require('events').EventEmitter;

var NodeMap = require("./node_map.js").node_map;

/**
 * Create a node instance
 * @class
 * @classdesc Node class
 * @name node
 * @mixes EventEmitter
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
	 * @name node#value
	 * @type {*}
	 */
	this.value = null;
	/**
	 * Timestamp of the last change
	 * @name node#time
	 * @type {timestamp}
	 */
	this.time = null;

	/**
	 * Meta data describing the data in the node
	 * @name node#metadata
	 * @type {object}
	 */
	this.metadata = null;

	/**
	 * Connected config
	 * @name node#_config
	 * @type {object}
	 */
	this._config = null;

	this.subscription_listener = [];
	this.announcement_listener = [];
	this.ready_listener = [];

	this.parentnode = parentnode;

	EventEmitter.call(this);

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
util.inherits(exports.node, EventEmitter);
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
 * Connect config to a node. Will be announced with to node
 */
exports.node.prototype.connect_config = function(config) {
	this._config = config;
};

/**
 * Connect configuration schema to a node. Will be announced with to node
 */
exports.node.prototype.connect_schema = function(schema) {
	this._schema = schema;
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
	} else if (typeof metadata !== "object" || metadata === null) {
		metadata = {};
	} else {
		metadata = JSON.parse(JSON.stringify(metadata));
	}
	if (this.metadata === null) {
		console.log("new node:", this.name);
		update = false;
	} else if (!update) {
		console.warn("Announcing already available node:", this.name);
		update = true;
	}

	if (this._schema) {
		metadata.schema = JSON.parse(JSON.stringify(this._schema));
	}
	if (this._config) {
		// clone config
		metadata.config = JSON.parse(JSON.stringify(this._config));
		// remove sub config:
		metadata.config.app = undefined;
	}

	this.metadata = metadata;
	this._announced = new Date()*1;

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

	this.announce_local("unannounce");

	this.metadata = null;
	this._announced = null;
	this.time = null;
	this.value = null;

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

/* Route data (synchronous)
 *
 * This is an internal expert function
 * DO NOT USE!
 */
/* istanbul ignore next expert function */
exports.node.prototype.publish_sync = function(time, value, only_if_differ, do_not_add_to_history, initial) {
	if (typeof time === "undefined")
		time = this.unique_date();

	if (this.set(time, value, only_if_differ, do_not_add_to_history, initial)) {
		this.subscription_notify(do_not_add_to_history, initial);
	}
	return time;
};

/**
 * Asynchronously publish new data in a node. If `undefined` is passed for the timestamp the current time is used. Please do not create timestamps on your own.
 *
 * Publishing `null` means that we did not get any value (in a longer time).
 *
 * @param {timestamp} time - The timestamp
 * @param {*} value - The value
 * @param {Boolean} only_if_differ - Publish only if value differ from previous value
 * @param {Boolean} do_not_add_to_history - Do not add the value to the history
 * @fires node#registered
 * @this node
 * @example
 * node.publish(undefined, 10);
 */
exports.node.prototype.publish = function(time, value, only_if_differ, do_not_add_to_history, initial) {
	var _this = this;

	if (typeof time === "undefined" || time === null)
		time = this.unique_date();
	if (typeof time === "object" && typeof time.getMonth !== 'function') {
		var object = time;
		time = object.time;
		value = object.value;
		only_if_differ = object.only_if_differ;
		do_not_add_to_history = object.do_not_add_to_history;
		initial = object.initial;
	}
	if (typeof only_if_differ === "object" && only_if_differ !== null) {
		var object = only_if_differ;
		only_if_differ = object.only_if_differ;
		do_not_add_to_history = object.do_not_add_to_history;
		initial = object.initial;
	}

	process.nextTick(function() {
		if (_this.set(time, value, only_if_differ, do_not_add_to_history, initial)) {
			_this.subscription_notify(do_not_add_to_history, initial);
		}
	});

	return time;
};

/* Route data array (asynchronous)
 *
 * This is an internal expert function
 * DO NOT USE!
 */
/* istanbul ignore next expert function */
exports.node.prototype.publish_all = function(data, step, done, offset) {
	if (typeof offset !== "number") {
		offset = 0;
	}
	var slots = 10000;
	var i = offset;
	var n = Math.min(offset+slots, data.length);
	for (; i < n; i++) {
		this.publish(data[i]);
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
/* istanbul ignore next deprecated */
exports.node.prototype.connect = function(dnode, metadata) {
	throw new Error("Deprecated function: connect");
};

/**
 * Subscribe to the changes of a node
 * @param {node~subscribeCallback} callback - The function to be called on new data
 * @fires node#registered
 * @this node
 * @example
 * var s = node.subscribe(function(do_not_add_to_history, initial) {
 *	// ...
 * });
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
 * @example
 * var s = node.subscribe(function(do_not_add_to_history, initial) {
 *	// ...
 * });
 * node.unsubscribe(s);
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
 * @param {string} filter_method - Only listen to a specific method [`announce`, `unannounce`, `remove`] (optional)
 * @param {function} object - The function to be called an new announcements
 * @example
 * var s = node.subscribe_announcement(function(snode, method, initial, update) {
 *	// ...
 * });
 * var s = node.subscribe_announcement("announce", function(snode, method, initial, update) {
 *	// ...
 * });
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
 * @example
 * var s = node.subscribe_announcement(function(snode, method, initial, update) {
 *	// ...
 * });
 * node.unsubscribe_announcement(s);
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
 * @param {string} filter_method - Only listen to a specific method [`announce`, `unannounce`, `remove`] (optional)
 * @param {function} object - The function to be called an ready
 * @example
 * var s = node.ready(function(method, initial, update) {
 *	// ...
 * });
 * var s = node.ready("announce", function(method, initial, update) {
 *	// ...
 * });
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
 * var s = node.ready(function(method, initial, update) {
 *	// ...
 * });
 * node.ready_remove(s);
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
 * @example
 * var s = node.filter([{
 *	nodes: ["/hello", "/world"],
 *	depth: 2
 * },{ // OR
 *	metadata: {
 *		"type": "my.app"
 *	}
 * }], function(snode, method, initial, update) {
 *	// ...
 * });
 * node.unsubscribe_announcement(s);
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


/**
 * Create a node-map
 *
 * @param {object} app_config - A config object
 * @param {object} [map_settings] - A config object
 * @param {(string|application|boolean)} [map_settings.app] - An application to map content
 * @param {(boolean|object|function)} [map_settings.map_extra_elements] - Map extra elements?
 * @param {function} [map_settings.map_key] - Map key function
 * @param {function} [map_settings.map_initialise] - Map initialise element
 * @example
 * var map = node.map(app_config, {
 *	"map_extra_elements": true,
 *	"map_key": function(c) {
 *		var name = c.map;
 *		return name;
 *	},
 *	"map_initialise": function(n, metadata, c) {
 *		n.rpc_set = function(reply, value, time) { };
 *		n.announce(metadata);
 *	}
 * });
 * var on_message = function(item, value) {
 *	var n = map.node(item);
 *	if (n) {
 *		n.publish(undefined, value);
 *	}
 * };
 */
exports.node.prototype.map = function(app_config, map_settings) {
	/* deprecated usage (app_config, app, map_extra_elements,
	 *	map_key, map_initialise) {
	 */
	var node = this;

	if (typeof map_settings === "string" ||
			arguments.length > 2) { // is app
		map_settings = {
			"app": arguments[1],
			"map_extra_elements": arguments[2],
			"map_key": arguments[3],
			"map_initialise": arguments[4],
		};
	}

	var map = new NodeMap(node, app_config, map_settings);
	map.init();
	return map;
};

/* Remote procedure calls */
exports.node.prototype.rpc_data = function(reply, time, value, only_if_differ, do_not_add_to_history, initial) {
	this.publish(time, value, only_if_differ, do_not_add_to_history, initial);
	reply(null, "okay");
};

exports.node.prototype.rpc_where_are_you_from = function(reply) {
	console.log("I'm from", this.router.name);
	reply(null, this.router.name);
};
/**
 * RPC config: Reinit and save new app configuration
 * @param {function} reply - RPC reply function
 * @param {object} config - New config object
 * @param {boolean} save - Flag to save the configuration
 * @private
 */
exports.node.prototype.rpc_config = function(reply, config, save) {
	if (typeof this._config !== "object" || this._config === null) {
		return reply("no_config", "No config object set");
	}

	// check configuration by schema:
	if (typeof this.metadata.schema === "object" &&
			this.metadata.schema !== null) {
		if (!json_validate(this.metadata.schema, config)) {
			return reply("invalid_config", m);
		}
	}

	// update config object:
	this._config = merge(this._config, config, ["app", "node", "pnode",
			"source", "metadata", "self_app"]);

	// restart app:
	if (this._app) {
		var a = this._app;
		a._reinit();

		if (save) {
			a._main.emit("config_save");
			return reply(null, "saved");
		}
	}

	reply(null, "okay");
};
/**
 * RPC config node: Move the app to an other node
 * @param {function} reply - RPC reply function
 * @param {string} relativ_nodename - New node name
 * @param {boolean} save - Flag to save the configuration
 * @private
 */
exports.node.prototype.rpc_config_node = function(reply, relative_nodename) {
	if (typeof relative_nodename !== "string")
		return reply("parameter", "relative_nodename is not string");
	var app = this._app;

	// set new node name:
	var n = app._node.node(relative_nodename);
	this._config.node = n.name;

	app._reload(function(a) {
		reply("node_moved", relative_nodename);
	});
};
/**
 * RPC activate: Activate or deactivate app
 * @param {function} reply - RPC reply function
 * @param {boolean} activate - Activate or deactivate app
 * @param {boolean} save - Flag to save the configuration
 * @private
 */
exports.node.prototype.rpc_deactivate = function(reply, deactivate, save) {
	if (typeof deactivate !== "boolean") {
		return reply(new Error("deactivate argument not set"));
	}

	let app = this._app;
	if (!app) {
		return reply(new Error("No application set"));
	}
	if (app._state === "DEACTIVE" && !deactivate) {
		unload_object(app._object);
		app._object = null;
		delete app._struct.deactive;

		setImmediate(function() {
			app._init(app._config);
		});
	}
	if (app._state !== "DEACTIVE" && deactivate) {
		app._unload();
		app._struct.deactive = true;
		setImmediate(function() {
			app._set_state("DEACTIVE");
		});
	}

	if (save) {
		a._main.emit("config_save");
		return reply(null, "saved");
	}

	reply(null, "okay");
};
/**
 * Register a RPC command on the node
 * @param {string} method - Method to be called
 * @param {function} callback - Function to register
 * @example
 * node.on_rpc("ping", function(reply, text) {
 *	reply(null, "pong " + text);
 * });
 */
exports.node.prototype.on_rpc = function(method, callback) {
	var _this = this;

	if (typeof method !== "string")
		throw new Error("on_rpc: method is not a string");
	if (typeof callback !== "function")
		throw new Error("on_rpc: callback is not a function");
	this["rpc_" + method] = callback;

	return function() {
		if (_this["rpc_" + method] === callback) {
			_this["rpc_" + method] = undefined;
		}
	}
};

/**
 * Execute a RPC command on the node
 * @param {string} method - Method to be called
 * @param {...*} args - Extra arguments
 * @param {function} [callback] - Callback to get the result
 * @example
 * node.rpc("ping", function(err, data) {
 *	if (err) {
 *		return consle.error(err);
 *	}
 *	// ..
 *	console.log(data);
 * });
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
			if (this.router.rpcstack._rpc_process(method, args, reply, _this)) {
				return;
			}
			else if (this.router.rpcstack._rpc_process("node_" + method, args,
						reply, _this, this.router)) {
				return;
			}
			throw new Error("method not found:" + method);
		} catch (e) {
			console.warn("Router, process local rpc:",
				"\nnode:", this.name,
				"\nstack:", e.stack || e);
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
 * @name router
 * @param {string} [name] - The name of the router
 */
exports.router = function(name) {
	this.nodes = {};

	this.name = "osiota";
	if (typeof name === "string")
		this.name = name;

	this.rpcstack = rpcstack_init(this);

	EventEmitter.call(this);
};
util.inherits(exports.router, EventEmitter);

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
	name = name.replace(/\/{2,}/g, "/");

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
/**
 * RPC function: List current nodes.
 *
 * Please use subscribe_announcement
 * @deprecated
 */
exports.router.prototype.rpc_list = function(reply) {
	reply(null, this.nodes);
};

