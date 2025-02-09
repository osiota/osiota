const EventEmitter = require('events').EventEmitter;

const NodeMap = require("./node_map.js").node_map;
const nodename_transform = require("./helper_nodenametransform").nodename_transform;
const match = require("./helper_match").match;
const unload_object = require("unload-object").unload;
const merge_object = require("./helper.js").merge_object;
const merge = require("./helper_merge_data.js").merge;
const json_validate = require("./helper_json_validate.js").json_validate;
const create_promise_callback = require("./helper_promise.js").create_promise_callback;

/**
 * Node class
 *
 * Nodes all exchanging information, either by publish/subscribe or from subscriber to publisher by RPC methods. It can transport any JavaScript data type besides functions.
 * @extends EventEmitter
 */
class node extends EventEmitter {
	/**
	 * Create a node instance
	 * @param {router} r - The router instance
	 * @param {string} name - The name of the node
	 * @param {node} parentnode - The parent node
	 * @fires router#create_new_node
	 */
	constructor(r, name, parentnode) {
		super();

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

		// subscripbe from remote host:
		let is_subscriped = false;
		const check_need_subscription = function(reinit) {
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
	/**
	 * Get a node instance
	 * @param {string} name - Name of the node
	 * @returns {node}
	 */
	node(name) {
		if (name.match(/^\//))
			return this.router.node(name);

		name  = name.replace(/^\.\//, '');

		if (name == "." || name == "")
			return this;

		const is_parent = name.match(/^\.\.\/(.*)$|^\.\.$/);
		if (is_parent && this.parentnode) {
			return this.parentnode.node(is_parent[1] || ".");
		}
		return this.router.node(this.name + "/" + name);
	};

	/**
	 * Create a virtual node for data handling
	 * @returns {node}
	 */
	virtualnode() {
		return new node(this.router, this.name, null);
	};

	/**
	 * Connect config to a node. Will be announced with to node
	 */
	connect_config(config) {
		this._config = config;
	};

	/**
	 * Connect configuration schema to a node. Will be announced with to node
	 */
	connect_schema(schema) {
		this._schema = schema;
	};

	/**
	 * Announce a node with meta data
	 * @param {object} metadata - Meta data describing the node
	 * @param {boolean} update - (For internal use only!)
	 * @fires router#announce
	 */
	announce(metadata, update) {
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
		if (this._app && this._app._node === this) {
			metadata = merge_object({}, [{
				"source_path": this.relative_path(this._app._source),
				"target_path": this.relative_path(this._app._target),
			}, metadata]);
		}
		if (this.metadata === null) {
			console.log("new node:", this.name);
			update = false;
		} else if (!update) {
			console.warn("Announcing already available node:", this.name, this.metadata, metadata);
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
	unannounce() {
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
	announce_local(method, update) {
		const _this = this;
		this.ready_listener.forEach(function(object) {
			_this.ready_listener_call(object, method, false, update);
		});

		this.announce_climb(this, method, update);
	};

	/* Announce node (climber) */
	announce_climb(node, method, update) {
		if (typeof node !== "object" || node === null) {
			node = this;
		}
		const _this = this;
		this.announcement_listener.forEach(function(object) {
			_this.announcement_listener_call(object, node, method,
					false, update);
		});

		// climp to parent:
		if (this.parentnode !== null) {
			this.parentnode.announce_climb(node, method, update);
		}
	};

	get_nodes(basename, children_of_children) {
		return this.router.get_nodes(basename, children_of_children);
	};

	/* Children of a node */
	get_children() {
		return this.router.get_nodes(this.name, false);
	};

	/* Generates metadata based on nodenames */
	generate_metadata() {
		let metadata = {};
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
			const type = this.name.match(/\.([^\/]*)$/);
			if (type) {
				metadata = {
					type: type[1]
				};
			}
		}

		this.announce(metadata);
	}

	/* create a unique time stamp */
	unique_date() {
		const d = new Date()/1000;
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
	set(time, value, only_if_differ, do_not_add_to_history) {
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
	publish_sync(time, value, only_if_differ, do_not_add_to_history, initial) {
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
	publish(time, value, only_if_differ, do_not_add_to_history, initial) {
		const _this = this;

		if (typeof time === "undefined" || time === null)
			time = this.unique_date();
		if (typeof time === "object" && typeof time.getMonth !== 'function') {
			const object = time;
			time = object.time;
			value = object.value;
			only_if_differ = object.only_if_differ;
			do_not_add_to_history = object.do_not_add_to_history;
			initial = object.initial;
		}
		if (typeof only_if_differ === "object" && only_if_differ !== null) {
			const object = only_if_differ;
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
	publish_all(data, step, done, offset) {
		if (typeof offset !== "number") {
			offset = 0;
		}
		const slots = 10000;
		let i = offset;
		const n = Math.min(offset+slots, data.length);
		for (; i < n; i++) {
			this.publish(data[i]);
		}
		if (i >= data.length) {
			if (typeof done === "function")
				process.nextTick(done);
		} else {
			console.log("time", data[i].time);
			let tid = setTimeout(this.publish_all.bind(this),
					0,
					data, step, done, n);
			if (typeof step === "function")
				step(tid);
		}
	};

	/* Route data (give a callback to subscribe) */
	publish_subscribe_cb() {
		const dnode = this;
		return function(do_not_add_to_history, initial) {
			dnode.publish(this.time, this.value, undefined,
					do_not_add_to_history);
		};
	};

	/* DEPRECATED: Register a link name for a route */
	/* istanbul ignore next deprecated */
	connect(dnode, metadata) {
		throw new Error("Deprecated function: connect");
	};

	/**
	 * Subscribe to the changes of a node
	 * @param {node~subscribeCallback} callback - The function to be called on new data
	 * @fires node#registered
	 * @this node
	 * @example
	 * const s = node.subscribe(function(do_not_add_to_history, initial) {
	 *	// ...
	 * });
	 */
	subscribe(callback) {
		// Save the time when this entry was added
		const object = callback.bind(this);
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
	 * const s = node.subscribe(function(do_not_add_to_history, initial) {
	 *	// ...
	 * });
	 * node.unsubscribe(s);
	 */
	unsubscribe(object) {
		for(let j=0; j<this.subscription_listener.length; j++) {
			if (this.subscription_listener[j] === object) {
				const r = this.subscription_listener.splice(j, 1);
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
	subscription_notify(do_not_add_to_history, initial) {
		if (typeof do_not_add_to_history === "undefined") {
			do_not_add_to_history = false;
		}

		const _this = this;
		this.subscription_listener.forEach(function(f) {
			f.call(_this, do_not_add_to_history, initial);
		});
	};

	/**
	 * Subscribe to announcements
	 * @param {string} filter_method - Only listen to a specific method [`announce`, `unannounce`, `remove`] (optional)
	 * @param {function} object - The function to be called an new announcements
	 * @example
	 * const s = node.subscribe_announcement(function(snode, method, initial, update) {
	 *	// ...
	 * });
	 * const s = node.subscribe_announcement("announce", function(snode, method, initial, update) {
	 *	// ...
	 * });
	 */
	subscribe_announcement(filter_method, callback){
		let object;
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
		const allchildren = this.router.get_nodes(this.name);
		for(const childname in allchildren) {
			const nc = allchildren[childname];
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
	 * const s = node.subscribe_announcement(function(snode, method, initial, update) {
	 *	// ...
	 * });
	 * node.unsubscribe_announcement(s);
	 */
	unsubscribe_announcement(object) {
		for(let j=0; j<this.announcement_listener.length; j++) {
			if (this.announcement_listener[j] === object) {
				// remove listener:
				this.announcement_listener.splice(j, 1);

				// call listener with method remove:
				this.announcement_listener_call(object, this,
						"remove", true);

				// call childen with method remove:
				const allchildren = this.router.get_nodes(this.name);
				for(const childname in allchildren) {
					const nc = allchildren[childname];
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
	announcement_listener_call(object, node,
				method, initial, update) {
		let o = null;
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
	 * const s = node.ready(function(method, initial, update) {
	 *	// ...
	 * });
	 * const s = node.ready("announce", function(method, initial, update) {
	 *	// ...
	 * });
	 */
	ready(filter_method, callback) {
		let object;
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
	 * const s = node.ready(function(method, initial, update) {
	 *	// ...
	 * });
	 * node.ready_remove(s);
	 */
	ready_remove(object) {
		for(let j=0; j<this.ready_listener.length; j++) {
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
	ready_listener_call(object, method, initial, update) {
		let o = null;
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
	is_parentnode(parent) {
		if(parent == this || parent == this.name)
			return 0;
		if (this.parentnode !== null) {
			const r = this.parentnode.is_parentnode(parent);
			if (r >= 0)
				return r+1;
		}
		return -1;
	}

	relative_path(to) {
		const components_to = to.name.split(/\//);
		const components_from = this.name.split(/\//);

		const components_new = [];
		let found = false;
		components_to.forEach(function(c, i) {
			if (!found) {
				if (components_from.length <= i) {
					found = true;
				} else if (components_from[i] !== c) {
					found = true;
					for (let j=i; j<components_from.length; j++) {
						components_new.push("..");
					}
				}
			}
			if (found) {
				components_new.push(c);
			}
		});
		if (!found) {
			const i = components_to.length-1;
			for (let j=i; j<components_from.length-1; j++) {
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
	 * const s = node.filter([{
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
	filter(filter_config, filter_method, callback) {
		if (typeof filter_method === "function") {
			callback = filter_method;
			filter_method = null;
		}
		if (typeof callback !== "function") {
			throw new Error("filter: callback is not a function");
		}
		return this.subscribe_announcement(filter_method, function(node,
					method, initial, update) {
			const f = this.filter_node(filter_config, node);
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
	filter_node(filter_config, node) {
		// default: filter nothing:
		if (typeof filter_config === "undefined" || filter_config === null)
			return true;

		if (typeof filter_config === "object" &&
				Array.isArray(filter_config)) {
			for (const k in filter_config) {
				if (filter_config.hasOwnProperty(k)) {
					const r = this.filter_node(filter_config[k],
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
			const l = node.is_parentnode(this);
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
	 * const map = node.map(app_config, {
	 *	"map_extra_elements": true,
	 *	"map_key": function(c) {
	 *		const name = c.map;
	 *		return name;
	 *	},
	 *	"map_initialise": function(n, metadata, c) {
	 *		n.rpc_set = function(reply, value, time) { };
	 *		n.announce(metadata);
	 *	}
	 * });
	 * const on_message = function(item, value) {
	 *	const n = map.node(item);
	 *	if (n) {
	 *		n.publish(undefined, value);
	 *	}
	 * };
	 */
	map(app_config, map_settings) {
		/* deprecated usage (app_config, app, map_extra_elements,
		 *	map_key, map_initialise) {
		 */
		const node = this;

		if (typeof map_settings === "string" ||
				arguments.length > 2) { // is app
			map_settings = {
				"app": arguments[1],
				"map_extra_elements": arguments[2],
				"map_key": arguments[3],
				"map_initialise": arguments[4],
			};
		}

		const map = new NodeMap(node, app_config, map_settings);
		map.init();
		return map;
	};

	/* Remote procedure calls */
	rpc_data(reply, time, value, only_if_differ, do_not_add_to_history, initial) {
		this.publish(time, value, only_if_differ, do_not_add_to_history, initial);
		reply(null, "okay");
	};

	rpc_where_are_you_from(reply) {
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
	rpc_config(reply, config, save) {
		if (typeof this._config !== "object" || this._config === null) {
			return reply("no_config", "No config object set");
		}

		// check configuration by schema:
		if (typeof this.metadata.schema === "object" &&
				this.metadata.schema !== null) {
			if (!json_validate(this.metadata.schema, config)) {
				return reply("invalid_config", {
					schema: this.metadata.schema,
					config: config,
				});
			}
		}

		// update config object:
		this._config = merge(this._config, config, ["app", "node", "pnode",
				"source", "metadata", "self_app"]);

		// restart app:
		if (this._app) {
			const a = this._app;
			a.restart();

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
	rpc_config_node(reply, relative_nodename) {
		if (typeof relative_nodename !== "string")
			return reply("parameter", "relative_nodename is not string");
		const app = this._app;

		// set new node name:
		const n = app.node.node(relative_nodename);
		this._config.node = n.name;

		(async ()=>{
			await app.restart();
			reply("node_moved", relative_nodename);
		})();
	};
	/**
	 * RPC activate: Activate or deactivate app
	 * @param {function} reply - RPC reply function
	 * @param {boolean} activate - Activate or deactivate app
	 * @param {boolean} save - Flag to save the configuration
	 * @private
	 */
	rpc_deactivate(reply, deactivate, save) {
		if (typeof deactivate !== "boolean") {
			return reply(new Error("deactivate argument not set"));
		}

		let app = this._app;
		if (!app) {
			return reply(new Error("No application set"));
		}
		if (app._state === "DEACTIVE" && !deactivate) {
			app._reinit();
		}
		if (app._state !== "DEACTIVE" && deactivate) {
			app._deactivate();
		}

		if (save) {
			app._main.emit("config_save");
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
	on_rpc(method, callback) {
		const _this = this;

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
	rpc(method, ...args) {
		const _this = this;
		if (!this.hasOwnProperty("connection")) {
			let callback = null;
			let reply = null;
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
			const ws = this.connection;

			if (ws !== null)
				ws.node_rpc.apply(ws, [this, method, ...args]);
		}
	};

	/**
	 * Execute a RPC promise command on the node
	 * @param {string} method - Method to be called
	 * @param {...*} args - Extra arguments
	 * @example
	 * await node.rpc("ping", 1, 2, 3);
	 */
	async_rpc(method, ...args) {
		const _this = this;
		if (!this.hasOwnProperty("connection")) {

			try {
				const p = this.router.rpcstack._rpc_process_promise(method, args, this);
				if (p) return p;
				const p2 = this.router.rpcstack._rpc_process_promise("node_" + method, args, _this, this.router);
				if (p2) return p2;

				throw new Error("method not found:" + method);
			} catch (e) {
				console.warn("Router, process local rpc:",
					"\nnode:", this.name,
					"\nstack:", e.stack || e);
				reply("Exception:", (e.stack || e).toString());
			}
		} else {
			const [reply, promise] = create_promise_callback();

			const ws = this.connection;
			ws.node_rpc.apply(ws, [this, method, ...args, reply]);

			return promise;
		}
	};

	/**
	 * Get a RPC function off the node
	 * @param {string} method - Method to be called
	 * @returns {function} RPC function
	 * @example
	 * const f = node.rpc_cache("ping");
	 * const result1 = await f(...args);
	 * const result2 = await f(...args);
	 */
	rpc_cache(method) {
		const _this = this;
		if (!this.hasOwnProperty("connection") || this.connection === null) {
			try {
				const p = this.router.rpcstack._rpc_process_promise_get(method, this);
				if (p) return p;

				const p2 = this.router.rpcstack._rpc_process_promise_get("node_" + method, this, this.router);
				if (p2) return p2;

				throw new Error("method not found:" + method);
			} catch (e) {
				console.warn("Router, process local rpc:",
						"\nnode:", this.name,
						"\nstack:", e.stack || e);
				throw e;
			}
		} else {
			return function(...args) {
				const [reply, promise] = create_promise_callback();
				const ws = this.connection;
				ws.node_rpc.apply(ws, [_this, method, ...args, reply]);
				return promise;
			}
		}
	};


	/* Overwrite function to convert object to string: */
	toJSON() {
		const n = {};
		n.value = this.value;
		n.time = this.time;

		// stringify ??
		return n;
	};

};
exports.node = node;
