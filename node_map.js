/**
 * Create a node map
 * @class
 * @classdesc NodeMap class
 * @param {node} node - A node instance
 * @param {object} config - A config object
 * @param {(string|application|boolean)} [app] - An application to map content
 * @param {(boolean|object|function)} [map_extra_elements] - Map extra elements?
 */
exports.node_map = function(node, config, app, map_extra_elements) {
	var _this = this;

	this._node = node;
	this._config = config;
	this._app = app;
	this.map_extra_elements = map_extra_elements;

	this.map = {};

	if (!Array.isArray(config)) {
		if (config && typeof config.map === "object" &&
				config.map !== null) {
			config = config.map;
		} else {
			throw new Error("map config is not defined.");
		}
	}
};

/**
 * Initialize config
 */
exports.node_map.prototype.init = function() {
	// Map existing config items:
	this._config.forEach(function(app_config) {
		var key = _this.map_key(app_config);
		if (typeof key !== "string")
			return;
		if (typeof app_config.node !== "string") {
			app_config.node = key.replace(/^\//, "");
		}
		return _this.map_element(key, app_config, null, true);
	});
};

/**
 * Map a config object to a node
 * @param {object} app_config - A config object
 * @param {object} [local_metadata] - Addional metadata
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
		app_config.node = key.replace(/^\//, "");
	}

	this._config.push(app_config);
	if (this._config.__listener) {
		this._config.__listener();
	}

	return this.map_element(key, app_config, local_metadata,
			false, cache);
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
		local_metadata){
	var local_app = this._app;
	if (typeof app_config.self_app !== "undefined"){
		local_app = app_config.self_app;
	}
	if (local_app === false || app_config.node === "" ||
			app_config.node === "-")
		return null;

	var n;
	if (local_app === null) {
		n = this._node.node(app_config.node);
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
		metadata = app_config.metadata;
	}
	this.map_initialise(n, metadata, app_config);

	var a;
	if (local_app !== null) {
		a = n.app(local_app, app_config);
	}

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
 * @param {object} metadata -  metadata gathered together
 * @param {object} app_config - Mapped or saved config
 */
exports.node_map.prototype.map_initialise = function(n, metadata, app_config) {
	n.announce(metadata);
};

/**
 * Map a config object to a string
 * @param {object} app_config - A config object
 * @param {*} [cache] - Addional object for caching
 */
exports.node_map.prototype.map_key = function(app_config, cache) {
	return ""+app_config.map;
};

