const get_ref = require("./helper_get_ref.js").get_ref;
const get_deref_all = require("./helper_get_ref.js").get_deref_all;

/**
 * Create a node-map
 * @class
 * @classdesc Node-Map class
 * @name node_map
 * @param {node} node - A node instance
 * @param {object} app_config - A config object
 * @param {object} [map_settings] - A config object
 * @param {(string|application|boolean)} [map_settings.app] - An application to map content
 * @param {(boolean|object|function)} [map_settings.map_extra_elements] - Map extra elements?
 * @param {function} [map_settings.map_key] - Map key function
 * @param {function} [map_settings.map_initialise] - Map initialise element
 * @example
 * var map = new main.classes.NodeMap(node, config, {
 *	"map_key": function(app_config) {
 *		return ""+app_config.map;
 *	},
 *	"map_initialise": function(n, metadata, app_config) {
 *		n.rpc_set = function(reply, value, time) { };
 *		n.announce(metadata);
 *	},
 * });
 * map.init();
 * var on_message = function(item, value) {
 *	var n = map.node(item);
 *	if (n) {
 *		n.publish(undefined, value);
 *	}
 * };
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
exports.node_map = function(node, config, map_settings) {
	this._node = node;
	this._app = null;

	if (typeof map_settings === "object") {
		if (typeof map_settings.app !== "undefined")
			this._app = map_settings.app;
		this.map_extra_elements = map_settings.map_extra_elements;
		if (typeof map_settings.map_key === "function")
			this.map_key = map_settings.map_key;
		if (typeof map_settings.map_initialise === "function")
			this.map_initialise = map_settings.map_initialise;
	}

	this.map = {};
	this._forEachCallbacks = [];

	if (Array.isArray(config)) {
		this._config = config;
	} else if (typeof config === "object" && config !== null) {
		if (typeof config.map !== "object" ||
				config.map === null) {
			config.map = [];
		}
		this._config = config.map;
		if (typeof config.map_app !== "undefined") {
			this._app = config.map_app;
		}
		if (typeof config.map_extra !== "undefined") {
			this.map_extra_elements = config.map_extra;
		}
	} else {
		throw new Error("map config is not defined.");
	}
};

/**
 * Initialize config
 */
exports.node_map.prototype.init = function() {
	var _this = this;

	// Map existing config items:
	this._config.forEach(function(app_config) {
		var key = _this.map_key(app_config);
		if (typeof key !== "string")
			return;
		if (typeof app_config.node !== "string") {
			app_config.node = key.replace(/^\//, "");
		}
		_this.map_element(key, app_config, null);
	});
};

/**
 * Map a config object to a node
 * @param {object} app_config - A config object
 * @param {object} [local_metadata] - Addional meta data
 * @param {*} [cache] - Addional object for caching
 */
exports.node_map.prototype.node = function(app_config, local_metadata, cache) {
	if (typeof app_config !== "object" ||
			app_config === null) {
		app_config = {
			"map": app_config
		};
	}

	var key = this.map_key(app_config, cache);
	if (typeof key !== "string")
		return null;

	if (this.map.hasOwnProperty(key)) {
		if (typeof this.map[key].vn !== "undefined") {
			var vn = this.map[key].vn;
			return vn;
		}
		if (typeof this.map[key].config !== "undefined") {
			app_config = this.map[key].config;
		}
	}

	if (!this.map_extra_elements) {
		return null;
	}
	if (typeof this.map_extra_elements === "object"
			&& this.map_extra_elements !== null) {
		for (var m in this.map_extra_elements) {
			app_config[m] = this.map_extra_elements[m];
		}
	}
	if (typeof this.map_extra_elements === "function") {
		this.map_extra_elements(app_config, local_metadata);
	}
	if (typeof app_config.node !== "string") {
		app_config.node = this.map_nodename(key, app_config, local_metadata);
	}

	this._config.push(app_config);
	if (this._config.__listener) {
		this._config.__listener();
	}

	return this.map_element(key, app_config, local_metadata, cache);
};

/**
 * Unload all nodes
 */
exports.node_map.prototype.unload = function() {
	for(var s in this.map) {
		if (this.map.hasOwnProperty(s)) {
			this.map[s].vn.unannounce();
			if (this.map[s].a)
				this.map[s].a.unload();
			else
				delete this.map[s].vn._app;
			delete this.map[s];
		}
	}
};

/**
 * Remove a single node
 * @param {object} app_config - A config object
 */
exports.node_map.prototype.remove_node = function(app_config) {
	if (typeof app_config === "string") {
		app_config = {
			"map": app_config
		};
	}
	var key = this.map_key(app_config);

	if (this.map.hasOwnProperty(key)) {
		this.map[key].vn.unannounce();
		delete this.map[key].vn;
		if (this.map[key].a) {
			this.map[key].a.unload();
			delete this.map[key].a;
		}
	}
};

/*
 * INTERNAL: Map element
 * @private
 */
exports.node_map.prototype.map_element = function(key, app_config,
		local_metadata, cache){
	var _this = this;
	var local_app = this._app;
	if (typeof app_config.self_app !== "undefined"){
		local_app = app_config.self_app;
	}
	if (local_app === false || app_config.node === "" ||
			app_config.node === "-")
		return null;
	if (typeof local_app === "string") {
		let local_app_str = local_app;
		local_app = {
			"inherit": [ local_app_str ],
			"init": function() {
				var map = _this.get_schema_map();
				var s = _this.merge_schema_properties(
					this._base[local_app_str]._schema, map);
				this._node.connect_schema(s);
				return this._base[local_app_str].init.apply(this,
					arguments);
			}
		};
	}

	var n;
	if (local_app === null) {
		n = this._node.node(app_config.node);
		n._app = this._node._app;
	} else {
		n = this._node.virtualnode();
	}

	var metadata = {};
	if (typeof local_metadata === "object" &&
			local_metadata !== null) {
		metadata = local_metadata;
	}
	if (typeof app_config.metadata === "object" &&
			app_config.metadata !== null) {
		metadata = [metadata, app_config.metadata];
	}
	this.connect_schema(n);
	n.connect_config(app_config);

	this.map_initialise(n, metadata, app_config);

	var a;
	if (local_app !== null) {
		a = n.app(local_app, app_config);
	}

	var _this = this;
	this._forEachCallbacks.forEach(function(callback) {
		callback.call(_this, n, app_config);
	});

	this.map[key] = {
		vn: n,
		a: a,
		config: app_config
	};
	return n;
};

/**
 * Initialise a new node
 * @param {node} n - The node to initialse
 * @param {object} metadata - Meta data gathered together
 * @param {object} app_config - Mapped or saved config
 */
exports.node_map.prototype.map_initialise = function(n, metadata, app_config) {
	n.announce(metadata);
};

/**
 * Map a config object to a string
 * @param {object} app_config - Mapped or saved config
 * @param {*} [cache] - Addional object for caching
 */
exports.node_map.prototype.map_key = function(app_config, cache) {
	return ""+app_config.map;
};

/**
 * Map nodename
 * @param {string} key - String key for mapping
 * @param {object} app_config - Mapped or saved config
 * @param {object} [local_metadata] - Addional meta data
 */
exports.node_map.prototype.map_nodename = function(key, app_config, local_metadata) {
	return key.replace(/^\//, "");
}

/**
 * Get schema of mapped elements
 * @private
 */
exports.node_map.prototype.get_schema_map = function() {
	if (typeof this._schema_map !== "undefined") {
		return this._schema_map;
	}
	var node = this._node;
	if (typeof node._schema !== "object" || node._schema === null)
		return null;
	var schema = node._schema;

	var map = null;
	if (typeof schema.properties === "object" &&
			schema.properties !== null &&
			typeof schema.properties.map === "object" &&
			schema.properties.map !== null) {
		map = get_deref_all(schema, schema.properties.map);
	} else if (Array.isArray(schema.oneOf) && schema.oneOf.length &&
			typeof schema.oneOf[0] === "object" &&
			schema.oneOf[0] !== null  &&
			typeof schema.oneOf[0].properties === "object" &&
			schema.oneOf[0].properties !== null &&
			typeof schema.oneOf[0].properties.map === "object" &&
			schema.oneOf[0].properties.map !== null) {
		map = get_deref_all(schema, schema.oneOf[0].properties.map);
	} else {
		console.warn("Warning: No map-schema found:", node.name, node._schema);
	}
	if (!map) {
		this._schema_map = null;
		return null;
	}
	if (map.type === "array" &&
		typeof map.items === "object" &&
		map.items !== null
	) {
		this._schema_map = map.items;
		return map.items;
	}
	this._schema_map = null;
	return null;
};

/**
 * Connect Schema to node
 * @private
 */
exports.node_map.prototype.connect_schema = function(n) {
	var schema_map = this.get_schema_map();
	if (typeof schema_map === "object" && schema_map !== null) {
		n.connect_schema(schema_map);
	}
}

/**
 * Merge properties of two JSON Schemas
 * @private
 */
exports.node_map.prototype.merge_schema_properties = function(schema_1, schema_2) {
	if (typeof schema_1 !== "object" ||
			schema_1 === null ||
			typeof schema_1.properties !== "object" ||
			schema_1.properties === null) {
		return schema_2;
	}
	if (typeof schema_2 !== "object" ||
			schema_2 === null ||
			typeof schema_2.properties !== "object" ||
			schema_2.properties === null) {
		return schema_1;
	}
	var schema = JSON.parse(JSON.stringify(schema_1));
	for (let key in schema_2.properties) {
		if (schema_2.properties.hasOwnProperty(key)) {
			let p = JSON.parse(JSON.stringify(
					schema_2.properties[key]));
			//schema.properties[key].title =
			schema.properties[key] = p;
		}
	}
	if (Array.isArray(schema_2.required)) {
		if (!Array.isArray(schema_1.required)) {
			schema.required = schema_2.required;
		} else {
			schema.required = schema_2.required.concat(schema_1.required);
		}
	}
	if (typeof schema_2.additionalProperties !== "undefined") {
		if (!schema.additionalProperties) {
			schema.additionalProperties =
					schema_2.additionalProperties;
		}
	}
	return schema;
}

/**
 * Iterate through nodes of the map
 * @param {function} callback - Callback
 * @example
 * map.forEach(function(node, config) {
 * });
 */
exports.node_map.prototype.forEach = function(callback) {
	var r = [];
	var _this = this;
	for(var key in this.map) {
		if (this.map.hasOwnProperty(key)) {
			var vn = this.map[key].vn;
			var config = this.map[key].config;

			var o = callback.call(this, vn, config);
			if (o) r.push(o);
		}
	}
	var callback_adapter = function() {
		var o = callback.apply(this, arguments);
		if (o) r.push(o);
	};
	r.push(() => {
		this.forEachEnd(callback_adapter);
	});
	this._forEachCallbacks.push(callback_adapter);
	return r;
};
exports.node_map.prototype.forEachEnd = function(object) {
	for(var j=0; j<this._forEachCallbacks.length; j++) {
		if (this._forEachCallbacks[j] === object) {
			var r = this._forEachCallbacks.splice(j, 1);
			return true;
		}
	}
	throw new Error("forEachEnd failed");
};

/**
 * Bind a rpc callback to all nodes
 * @param {string} name - RPC name
 * @param {function} callback - RPC callback
 * @example
 * exports.init = function(node, app_config) {
 *     var map = node.map(...);
 *     var f = map.on_rpc("set", function(value, true) {
 *         // ...
 *     });
       return [f, map]; // automatically removed rpc bindings
 * }
 */
exports.node_map.prototype.on_rpc = function(...args) {
	return this.forEach(function(node, config) {
		return node.on_rpc(...args);
	});
};
