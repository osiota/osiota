/*
 * RemoteCall Library
 * A nodejs library to handle remote calls.
 *
 * Simon Walz, IfN, 2016
 */

var EventEmitter = require('events').EventEmitter;
var util = require('util');

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
		was_timedout = true;
		handler.call(_this, true);
		timer = null;
	}, timeout);
	this.once(event, listener);
};

/* Class: RemoteCall */
exports.remotecall = function() {
	this._rpc_calls = {};

	EventEmitter.call(this);
};
util.inherits(exports.remotecall, EventEmitter);

/* Bind a callback to this object and create a reference to it */
exports.remotecall.prototype._rpc_bind = function(method, callback) {
	var ref = method;
	var ref_i = 1;
	if (!this.hasOwnProperty("_rpc_calls")) {
		this._rpc_calls = {};
	}
	while (this._rpc_calls.hasOwnProperty(ref)) {
		ref_i++;
		ref = method + ref_i.toString();
	}
	this._rpc_calls[ref] = {"callback": callback};
	return ref;
};

/* get the callback (by reference) */
exports.remotecall.prototype._rpc_bind_get = function(ref) {
	var cb = false;
	if (typeof ref !== "string" || ref === "" ||
			!this.hasOwnProperty("_rpc_calls")) {
		return false;
	}
	if (this._rpc_calls.hasOwnProperty(ref)) {
		if (this._rpc_calls[ref].hasOwnProperty("callback")) {
			cb = this._rpc_calls[ref].callback;
		}
		delete this._rpc_calls[ref];
	}
	return cb;
};

/* Parse the answer of a remote call (and call the saved callback) */
exports.remotecall.prototype.rpc_reply = function(reply, ref, error, data) {
	if (error !== null) {
		console.log("RPC-Error:", error, data);

		// delete the reference:
		this._rpc_bind_get(ref);
	} else {
		var cb = this._rpc_bind_get(ref);
		if (cb) {
			cb.call(this, data);
		}
	}
};

/* Process indirect rpc calls */
exports.remotecall.prototype._rpc_process = function(method, args, reply, object) {
	if (typeof method !== "string" || method === "")
		return false;

	if (typeof this.refs === "object") {
		if (typeof this.refs[args[0]] === "object") {
			this.refs[args[0]].reply(null, args[2]);
			return true;
		}
	}
	if (typeof object !== "object" || object === null) {
		object = this;
	}
	if (typeof args === "undefined" || !Array.isArray(args)) {
		args = [];
	}
	if (typeof object['rpc_' + method] == "function") {
		args.unshift(reply);
		object['rpc_' + method].apply(this, args);
		return true;
	}
	return false;
};

/* Create a remote call object */
exports.remotecall.prototype._rpc_create_object = function(method) {
	var args = Array.prototype.slice.call(arguments);
	//var method =
	args.shift();
	var object = {};
	if (typeof args[args.length-1] === "function") {
		var cb = args.pop();
		object.ref = this._rpc_bind(method, cb);
	} else {
		var cb = function() {};
		object.ref = this._rpc_bind(method, cb);
	}
	object.type = method;
	object.args = args;
	return object;
};

exports.remotecall.prototype._rpc_forwarding = function(obj, reply) {
	// this == node
	var ws = this.src_obj;
	if (ws.closed) {
		console.log("websocket is closed.");
		return false;
	}

	obj.args.unshift(obj.type);
	obj.args.unshift(this.name);
	var object = ws.node_rpc.apply(ws, obj.args);
	obj.args.shift();
	obj.args.shift();
	this.router.refs[object.ref] = {"ref_obj":obj, "reply":reply};
	return true;
};
