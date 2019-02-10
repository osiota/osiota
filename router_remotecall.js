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
 * Remote call instance
 * @class
 * @classdesc Remote Call class
 * @abstract
 */
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
	var args = Array.prototype.slice.call(arguments, 2);
	var cb = this._rpc_bind_get(ref);
	if (!cb) {
		if (error !== null) {
			console.warn("RPC-Error:", args);
		}
	} else {
		cb.apply(this, args);
		// delete the reference:
		this._rpc_bind_get(ref);
	}
};

/* Process indirect rpc calls */
exports.remotecall.prototype._rpc_process = function(method, args, reply, object) {
	if (typeof method !== "string" || method === "")
		return false;

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
	}
	object.type = method;
	object.args = args;
	return object;
};

exports.remotecall.prototype._rpc_forwarding = function(obj, reply) {
	// this == node
	var ws = this.connection;
	var args = obj.args;

	args.unshift(obj.type);
	args.unshift(this);
	args.push(function(err, data) {
		var args = Array.prototype.slice.call(arguments);
		// forward data and error:
		reply.apply(null, args);
	});
	return ws.node_rpc.apply(ws, args);
};
