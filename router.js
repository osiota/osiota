
/* Helper: */
if (!RegExp.quote) {
	RegExp.quote = function(str) {
		return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
	};
}

const rpcstack_init = require("./rpc_stack.js").rpcstack_init;

const EventEmitter = require('events').EventEmitter;
const node = require("./node.js").node;


/**
 * Creates a Router instance
 * @class
 * @classdesc Router class
 * @name router
 * @param {string} [name] - The name of the router
 */
class router extends EventEmitter {
	constructor(name) {
		super();
		this.nodes = {};

		this.name = "osiota";
		if (typeof name === "string")
			this.name = name;

		this.rpcstack = rpcstack_init(this);

	};

	/* Route data */
	publish(name, time, value, only_if_differ, do_not_add_to_history) {
		var n = this.node(name);
		n.publish(time, value, only_if_differ, do_not_add_to_history);
	}


	/* Get names and data of the nodes */
	get_nodes(basename, children_of_children) {
		if (typeof basename !== "string") basename = "";
		if (basename === "/") basename = "";
		if (typeof children_of_children === "undefined") children_of_children = true;

		var nodes = {};
		var _this = this;

		// Filter nodes:
		var regex = new RegExp("^" + RegExp.quote(basename) + "(/.*)$", '');
		if (!children_of_children) {
			// only direct children:
			regex = new RegExp("^" + RegExp.quote(basename) + "(/[^/@]*)$", '');
		}


		// Sort keys:
		Object.keys(this.nodes).forEach(function(name) {
			var n = _this.nodes[name];

			// TODO: consider using .startsWith
			var found = name.match(regex)
			if (found) {
				nodes[found[1]] = n;
			}
		});
		return nodes;
	};

	/* Overwrite function to convert object to string: */
	toJSON() {
		var r = {};
		r.nodes = this.nodes.toJSON();
		return r;
	};


	/**
	 * Get a node instance
	 * @param {string} name - Name of the node
	 * @returns {node}
	 */
	node(name) {
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
	rpc_ping(reply) {
		reply(null, "ping");
	};
	/**
	 * RPC function: List current nodes.
	 *
	 * Please use subscribe_announcement
	 * @deprecated
	 */
	rpc_list(reply) {
		reply(null, this.nodes);
	};

};
exports.router = router;

exports.node = node;
