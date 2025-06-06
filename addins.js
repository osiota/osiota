const Node = require("./node").node;

exports.addins = function(main) {

	/**
	 * [LITTLE USED / DEPRECATED?? / IDEA]
	 *
	 * @todo: Check where this is used
	 * @deprecated
	 */
	/* istanbul ignore next deprecated */
	Node.prototype.app = function(app, app_config) {
		return main.application_loader.startup(this, app, app_config);
	};

	/**
	 * [LITTLE USED / DEPRECATED?? / IDEA]
	 *
	 * @todo: Check where this is used
	 * @deprecated
	 */
	/* istanbul ignore next deprecated */
	Node.prototype.load_app = function(app, app_config_app, callback) {
		return main.application_loader.load(this, app, app_config_app, callback);
	};

	/**
	 * [LITTLE USED / DEPRECATED?? / IDEA]
	 *
	 * @todo: Check where this is used
	 * @deprecated
	 */
	/* istanbul ignore next deprecated */
	main.map_app = function(metadatatype) {
		const subapp = {};
		subapp.init = function(node, app_config, main) {
			node.announce({
				"type": metadatatype
			});
			this._source.subscribe(function() {
				node.publish(this.time, this.value);
			});
			const _this = this;
			node.rpc_set = function(reply, value) {
				_this._source.rpc_set(reply, value);
			};
			return node;
		};
		return subapp;
	};

	/**
	 * [LITTLE USED / DEPRECATED?? / IDEA]
	 * Publish a changable property as a node
	 *
	 * Only used in lightmodule
	 *
	 * @deprecated
	 */
	/* istanbul ignore next deprecated */
	Node.prototype.property = function(name, type, callback, default_value, metadata){
		if (typeof default_value === "undefined")
			default_value = null;

		const e = this.node(name);
		e.rpc_set = function(reply, value) {
			if (value === null) {
				value = default_value;
			} else {
				if (typeof type === "string") {
					if (typeof value !== type) {
						throw new Error("Wrong data "+
								"type");
					}
				} else {
					// TODO: Check schema
				}
			}
			this.publish(undefined, value);
			if (typeof callback === "function") {
				callback(value);
			}
			reply(null, "okay");
		};
		e.rpc_publish = function(reply, time, value) {
			return this.rpc_set(reply, value);
		};

		// set default value:
		e.rpc("set", null);

		let ltype = type;
		let schema;
		if (typeof ltype !== "string") {
			ltype = "schema";
			schema = type;
		} else {
			schema = {
				"type": type
			};
		}
		e.announce([{
			"type": ltype+".property",
			"property": true,
			"schema": schema,
			"rpc": {
				"set": {
					"desc": "Set",
					"args": [true]
				}
			}
		}, metadata]);

		return e;
	};
	/**
	 * [NOT USED / DEPRECATED / IDEA]
	 * Get fields of an object published to a node
	 *
	 * @todo: use subkey
	 * @deprecated
	 */
	/* istanbul ignore next deprecated */
	Node.prototype.subnode = function(property, type) {
		const _this = this;
		const n = this.node(property);

		let value = null;
		const s = this.subscribe(function() {
			let v = null;
			value = this.value;
			if (typeof value === "object" &&
					value !== null) {
				v = value[property];
			}
			n.publish(this.time, v);
		});
		n.rpc_set = function(reply, v) {
			if (type && typeof v !== type) {
				throw new Error("Type does not match target.");
			}
			if (typeof value !== "object" || value === null) {
				value = {};
			}
			value[property] = v;

			_this.rpc("set", value);
			//_this.publish(undefined, value);

			reply(null, "okay");
		};
		n.rpc_publish = function(reply, time, value) {
			this.rpc_set(reply, value);
		};
		let ltype = type;
		let schema;
		if (typeof ltype !== "string") {
			ltype = "schema";
			schema = type;
		} else {
			schema = {
				"type": type
			};
		}
		n.announce({
			"type": ltype+".property",
			"schema": schema
		});

		return [n, s];
	};

};
