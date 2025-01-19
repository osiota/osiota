const get_ref = require("./helper_get_ref.js").get_ref;
const get_deref_all = require("./helper_get_ref.js").get_deref_all;

/**
 * Node-Map class
 */
class node_map {
	/**
	 * @param {node} node - A node instance
	 * @param {object} app_config - A config object
	 * @param {object} [map_settings] - A config object
	 * @param {(string|application|boolean)} [map_settings.app] - An application to map content
	 * @param {(boolean|object|function)} [map_settings.map_extra_elements] - Map extra elements?
	 * @param {function} [map_settings.map_key] - Map key function
	 * @param {function} [map_settings.map_initialise] - Map initialise element
	 * @example
	 * const map = new main.classes.NodeMap(node, config, {
	 *	"map_key": (app_config)=>{
	 *		return ""+app_config.map;
	 *	},
	 *	"map_initialise": (n, metadata, app_config, reannounce)=>{
	 *		n.rpc_set = function(reply, value, time) { };
	 *		n.announce(metadata, reannounce);
	 *	},
	 * });
	 * map.init();
	 * const on_message = function(item, value) {
	 *	const n = map.node(item);
	 *	if (n) {
	 *		n.publish(undefined, value);
	 *	}
	 * };
	 * @example
	 * const map = node.map(app_config, {
	 *	"map_extra_elements": true,
	 *	"map_key": (c)=>{
	 *		const name = c.map;
	 *		return name;
	 *	},
	 *	"map_initialise": (n, metadata, c, reannounce)=>{
	 *		n.rpc_set = function(reply, value, time) { };
	 *		n.announce(metadata, reannounce);
	 *	}
	 * });
	 * const on_message = function(item, value) {
	 *	const n = map.node(item);
	 *	if (n) {
	 *		n.publish(undefined, value);
	 *	}
	 * };
	 */
	constructor(node, config, map_settings) {
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
			if (typeof map_settings.no_initial_mapping !== "undefined") {
				this.no_initial_mapping = map_settings.no_initial_mapping;
			}
			if (typeof map_settings.reannounce_on_first_mapping !== "undefined") {
				this.reannounce_on_first_mapping = map_settings.reannounce_on_first_mapping;
			}
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
	init() {
		// Map existing config items:
		this._config.forEach((app_config)=>{
			const key = this.map_key(app_config);
			if (typeof key !== "string")
				return;
			if (typeof app_config.node !== "string") {
				app_config.node = key.replace(/^\//, "");
			}
			if (this.no_initial_mapping) {
				this.map[key] = {
					config: app_config,
				};
			} else {
				this.map_element(key, app_config, null);
			}
		});
	}

	/**
	 * Map a config object to a node
	 * @param {object} app_config - A config object
	 * @param {object} [local_metadata] - Addional meta data
	 * @param {*} [cache] - Addional object for caching
	 * @returns {node}
	 */
	node(app_config, local_metadata, cache) {
		if (typeof app_config !== "object" ||
				app_config === null) {
			app_config = {
				"map": app_config
			};
		}

		const key = this.map_key(app_config, cache);
		if (typeof key !== "string")
			return null;

		if (this.map.hasOwnProperty(key)) {
			const item = this.map[key];
			if (!item.seen) {
				for (const [key, value] of Object.entries(app_config)) {
					if (!(key in item.config)) {
						item.config[key] = value;
					}
				}
				if (this.reannounce_on_first_mapping) {
					let metadata = {};
					if (typeof local_metadata === "object" &&
							local_metadata !== null) {
						metadata = local_metadata;
					}
					if (typeof app_config.metadata === "object" &&
							app_config.metadata !== null) {
						metadata = [metadata, app_config.metadata];
					}
					this.map_initialise(item.vn, metadata, app_config, true, cache);
				}
				item.seen = true;
			}
			if (typeof item.vn !== "undefined") {
				return item.vn;
			}
			if (typeof item.config !== "undefined" && item.config !== null) {
				for (const [key, value] of Object.entries(app_config)) {
					if (!(key in item.config)) {
						item.config[key] = value;
					}
				}
				app_config = item.config;
			}
		} else {
			if (!this.map_extra_elements) {
				return null;
			}
			if (typeof this.map_extra_elements === "object"
					&& this.map_extra_elements !== null) {
				for (const m in this.map_extra_elements) {
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
		}

		return this.map_element(key, app_config, local_metadata, cache);
	};

	/**
	 * Unload all nodes
	 */
	unload() {
		for(const s in this.map) {
			if (this.map.hasOwnProperty(s)) {
				if (this.map[s].vn)
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
	remove_node(app_config) {
		if (typeof app_config === "string") {
			app_config = {
				"map": app_config
			};
		}
		const key = this.map_key(app_config);

		if (this.map.hasOwnProperty(key)) {
			if (this.map[key].vn)
				this.map[key].vn.unannounce();
			delete this.map[key].vn;
			if (this.map[key].a) {
				this.map[key].a.unload();
				delete this.map[key].a;
			}
			if (Array.isArray(this.map[key].sub_apps)) {
				this.map[key].sub_apps.forEach((a)=>{
					a.unload();
				});
				delete this.map[key].sub_apps;
			}
			this.map[key].seen = false;
		}
	}

	/*
	 * INTERNAL: Map element
	 * @private
	 */
	map_element(key, app_config, local_metadata, cache){
		let local_app = this._app;
		if (typeof app_config.self_app !== "undefined"){
			local_app = app_config.self_app;
		}
		if (local_app === false || app_config.node === "" ||
				app_config.node === "-")
			return null;
		if (typeof local_app === "string") {
			const _this = this;
			const local_app_str = local_app;
			local_app = {
				"inherit": [ local_app_str ],
				"init": function() {
					// use function, so that "this" works
					const map = _this.get_schema_map();
					const s = _this.merge_schema_properties(
						this._super[local_app_str]._schema, map);
					this._node.connect_schema(s);
					return this._super[local_app_str].init.apply(this,
						arguments);
				}
			};
		}

		let n;
		if (local_app === null) {
			n = this._node.node(app_config.node);
			n._app = this._node._app;
		} else {
			n = this._node.virtualnode();
		}

		let metadata = {};
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

		let a;
		if (local_app !== null) {
			a = n.app(local_app, app_config);
		}

		this._forEachCallbacks.forEach((callback)=>{
			callback.call(this, n, app_config);
		});
		let sub_apps = [];
		if (local_app === null && app_config.app) {
			sub_apps = n.load_app(app_config.app);
		}

		this.map[key] = {
			vn: n,
			a: a,
			config: app_config,
			sub_apps: sub_apps,
		};
		return n;
	}

	/**
	 * Initialise a new node
	 * @param {node} n - The node to initialse
	 * @param {object} metadata - Meta data gathered together
	 * @param {object} app_config - Mapped or saved config
	 */
	map_initialise(n, metadata, app_config) {
		n.announce(metadata);
	}

	/**
	 * Map a config object to a string
	 * @param {object} app_config - Mapped or saved config
	 * @param {*} [cache] - Addional object for caching
	 * @returns {string} Mapped key string
	 */
	map_key(app_config, cache) {
		return ""+app_config.map;
	}

	/**
	 * Map nodename
	 * @param {string} key - String key for mapping
	 * @param {object} app_config - Mapped or saved config
	 * @param {object} [local_metadata] - Addional meta data
	 */
	map_nodename(key, app_config, local_metadata) {
		return key.replace(/^\//, "");
	}

	/**
	 * Get schema of mapped elements
	 * @private
	 */
	get_schema_map() {
		if (typeof this._schema_map !== "undefined") {
			return this._schema_map;
		}
		const node = this._node;
		if (typeof node._schema !== "object" || node._schema === null)
			return null;
		const schema = node._schema;

		let map = null;
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
	}

	/**
	 * Connect Schema to node
	 * @private
	 */
	connect_schema(n) {
		const schema_map = this.get_schema_map();
		if (typeof schema_map === "object" && schema_map !== null) {
			n.connect_schema(schema_map);
		}
	}

	/**
	 * Merge properties of two JSON Schemas
	 * @private
	 */
	merge_schema_properties(schema_1, schema_2) {
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
		const schema = JSON.parse(JSON.stringify(schema_1));
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
	 * map.forEach((node, config)=>{
	 * });
	 */
	forEach(callback) {
		const r = [];
		for(const key in this.map) {
			if (this.map.hasOwnProperty(key) && this.map[key].vn) {
				const vn = this.map[key].vn;
				const config = this.map[key].config;

				const o = callback.call(this, vn, config);
				if (o) r.push(o);
			}
		}
		const callback_adapter = function() {
			const o = callback.apply(this, arguments);
			if (o) r.push(o);
		};
		r.push(() => {
			this._forEachEnd(callback_adapter);
		});
		this._forEachCallbacks.push(callback_adapter);
		return r;
	}
	_forEachEnd(object) {
		for(let j=0; j<this._forEachCallbacks.length; j++) {
			if (this._forEachCallbacks[j] === object) {
				const r = this._forEachCallbacks.splice(j, 1);
				return true;
			}
		}
		throw new Error("forEachEnd failed");
	}

	/**
	 * Bind a rpc callback to all nodes
	 * @param {string} name - RPC name
	 * @param {function} callback - RPC callback
	 * @example
	 * exports.init = function(node, app_config) {
	 *     const map = node.map(...);
	 *     const f = map.on_rpc("set", function(value, true) {
	 *         // ...
	 *     });
	       return [f, map]; // automatically removed rpc bindings
	 * }
	 */
	on_rpc(...args) {
		return this.forEach((node, config)=>{
			return node.on_rpc(...args);
		});
	}
}

exports.node_map = node_map;
