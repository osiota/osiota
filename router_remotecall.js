/*
 * RemoteCall Library
 * A nodejs library to handle remote calls.
 *
 * Simon Walz, IfN, 2016
 */

var EventEmitter = require('events').EventEmitter;
var util = require('util');

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
	if (typeof ref === "undefined" || ref === null ||
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
