/*
 * Remote Procedure Call (RPC) Stack
 *
 * (see {@link websocket_protocol.md|WebSocket protocol}
 */

var EventEmitter = require('events').EventEmitter;

var nodename_transform = require("./helper_nodenametransform").nodename_transform;

if (!EventEmitter.prototype.once_timeout)
EventEmitter.prototype.once_timeout = function(event, handler, timeout) {
	var _this = this;
	var timer = null;
	var listener = function() {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
		handler.call(_this, false);
	};
	timer = setTimeout(function() {
		_this.removeListener(event, listener);
		handler.call(_this, true);
		timer = null;
	}, timeout);
	this.once(event, listener);

	return {
		remove: function() {
			if (timer !== null) {
				clearTimeout(timer);
				timer = null;
			}
			_this.removeListener(event, listener);
		}
	};
};

/**
 * Remote Call class
 * @class
 * @classdesc Remote Call class
 * @name rpcstack
 * @abstract
 */
class rpcstack extends EventEmitter {
	constructor() {
		super();
		this._rpc_calls = {};

		this._scopes = {};
	};

	/**
	 * Register a scope
	 * @param {string} scope - Name of the scope
	 * @param {function} callback - Scope callback to handle the scope
	 * @returns {object} Scope object
	 */
	register_scope(scope, callback) {
		this._scopes[scope] = callback;
	};


	/**
	 * process a single command message (ie from websocket)
	 * @param {object} messages - RPC messages (see {@link websocket_protocol.md|WebSocket protocol})
	 * @param {function} respond - Respond callback
	 * @param {object} [module] - Source module
	 */
	process_single_message(d, respond, module) {
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
			// Mark as send:
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

			if (scope === "respond" && method === "reply") {
				this.process_reply(d, module);
				/*
				//this.rpc_reply(()=>{}, d.args[0], d.args[1], d.args[2]);
				if (this._rpc_process(method, d.args, reply, module, module)) {
					return;
				}
				*/
				return;
			}

			// get scope object:
			if (typeof this._scopes[scope] !== "function") {
				throw new Error("Scope not found.");
			}
			var r = this._scopes[scope].call(this, d, module);

			// call method
			if (typeof module === "object" && this._rpc_process(scope + "_" + method, d.args, reply, r, module)) {
				return;
			} else if (this._rpc_process(method, d.args, reply, r, r)) {
				return;
			} else if (this._rpc_process(scope + "_" + method, d.args, reply, r, module)) {
				return;
			} else if (typeof r.connection === "object" && this._rpc_forwarding(d, reply, r)) {
				return;
			}

			// method not found
			throw new Error("Router, process message: packet with unknown rpc command received: " + scope + "." + method +
				" Packet: "+ JSON.stringify(d));

		} catch (e) {
			console.warn("Router, process_single_message:\n",
					e.stack || e);
			console.warn("Packet: "+ JSON.stringify(d));
			reply("Exception", (e.stack || e).toString());
		}
	};

	/**
	 * process command messages (ie from websocket)
	 * @param {object[]} messages - RPC messages (see doc/websocket_protocol.md)
	 * @param {function} [respond] - Respond callback
	 * @param {object} [module] - Source module
	 */
	process_message(messages, respond, module) {
		var r = this;
		if (typeof respond !== "function")
			respond = function() {};

		if (!Array.isArray(messages)) {
			messages = [messages];
		}

		messages.forEach(function(m) {
			r.process_single_message(m, respond, module);
		});
	};

	unhandled_reply(error, message) {
		if (error !== null) {
			console.warn("RPC-Error:", error, message);
		}
	};

	process_reply(d, module) {
		var ref = d.args.shift();
		var cb = this._rpc_bind_get(module, ref);
		if (!cb) {
			cb = this.unhandled_reply;
		}
		cb.apply(this, d.args);
	};

	/* Bind a callback to this object and create a reference to it */
	_rpc_bind(cache, method, callback) {
		var ref = method;
		var ref_i = 1;
		if (!cache.hasOwnProperty("_rpc_calls")) {
			cache._rpc_calls = {};
		}
		while (cache._rpc_calls.hasOwnProperty(ref)) {
			ref_i++;
			ref = method + ref_i.toString();
		}
		cache._rpc_calls[ref] = {"callback": callback};
		return ref;
	};

	/* get the callback (by reference) */
	_rpc_bind_get(cache, ref) {
		var cb = false;
		if (typeof ref !== "string" || ref === "" ||
				!cache.hasOwnProperty("_rpc_calls")) {
			return false;
		}
		if (cache._rpc_calls.hasOwnProperty(ref)) {
			if (cache._rpc_calls[ref].hasOwnProperty("callback")) {
				cb = cache._rpc_calls[ref].callback;
			}
			delete cache._rpc_calls[ref];
		}
		return cb;
	};

	/* Parse the answer of a remote call (and call the saved callback) */
	/* DEPRECATED
	rpc_reply = function(reply, ref, error, data) {
		var args = Array.prototype.slice.call(arguments, 2);
		var cb = this._rpc_bind_get(ref); // TODO cache
		if (!cb) {
			if (error !== null) {
				console.warn("RPC-Error:", args);
			}
		} else {
			cb.apply(this, args);
			// delete the reference:
			this._rpc_bind_get(ref); // TODO cache
		}
	};
	*/
	/* Process indirect rpc calls */
	_rpc_process(method, args, reply, self, object) {
		if (typeof method !== "string" || method === "")
			return false;

		if (typeof object !== "object" || object === null) {
			object = self;
		}
		if (typeof args === "undefined" || !Array.isArray(args)) {
			args = [];
		}
		if (typeof object['rpc_' + method] == "function") {
			args.unshift(reply);
			// TODO: Has return value, Is Promise?
			object['rpc_' + method].apply(self, args);
			return true;
		}
		return false;
	};

	/**
	 * Create a remote call object
	 * @param {object} module - cache object
	 * @param {object} self - self object to bind callback to
	 * @param {object} args - RPC arguments including callback
	 * @returns {object} RPC communication object
	 */
	_rpc_create_object(module, self, args) {
		var method = args.shift();

		var object = {};
		if (typeof args[args.length-1] === "function") {
			var cb = args.pop();
			object.ref = this._rpc_bind(module, method, cb.bind(self));
		}
		//object.self = self;
		object.type = method;
		object.args = args;
		return object;
	};

	/**
	 * Forwards a RPC call to a remote host
	 * @param {object} obj - RPC communication object
	 * @param {function} reply - Replay callback
	 * @param {node} node - Node
	 */
	_rpc_forwarding(obj, reply, node) {
		var ws = node.connection;
		var args = obj.args;

		args.unshift(obj.type);
		args.unshift(node); // node name
		args.push(function(err, data) {
			var args = Array.prototype.slice.call(arguments);
			// forward data and error:
			reply.apply(null, args);
		});
		return ws.node_rpc.apply(ws, args);
	};

};
exports.rpcstack = rpcstack;

exports.rpcstack_init = function(router) {

	var rc = new exports.rpcstack();

	rc.register_scope("global", function(d, module) {
		return router;
	});
	rc.register_scope("node", function(d, module) {
		if (!d.hasOwnProperty('node')) {
			throw new Error("Message scope needs attribute node: " +
					JSON.stringify(d));
		}
		var n = router.node(nodename_transform(d.node, module.basename, module.remote_basename));

		if (this.hasOwnProperty('policy_checker')) {
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

		return n;
	});

	return rc;
};


