var list_nodes = function($target, data, cb) {
	$target.empty();
	var nodes = Object.keys(data).sort();
	for (var ki=0; ki<nodes.length; ki++) {
		var k = nodes[ki];
		if (data.hasOwnProperty(k)) {
			var $elem = cb(data[k], k);
			if (typeof $elem !== "undefined")
				$elem.appendTo($target);
		}
	}
}


var list_nodes_options = function(data) {
	list_nodes($("#addnode"), data, function(d, k) {
		//if (registered.hasOwnProperty(k)) {
		//	return undefined;
		//}
		var $option = $("<option/>").attr("value", k).text(k);
		//console.log("K: " + k + " = " + d.value);
		if (typeof d.value === "undefined")
			$option.attr("style", "color: gray;");
		else if (d.time > (new Date()/1000)-60)
			$option.attr("style", "color: blue;");

		return $option;
	});
};

/**
* Request data from the server, add it to the graph and set a timeout to request again
*/
var registered = {};

function load_data(init_func) {
	var rc = new rclient();
	return rc.init();
};

var rclient = function() {
	this.ws = null;
	this.routeruri = 'ws://'+window.location.hostname+':8080/';

	this.nodes = [];
	this.init_packets = [];

	this.event_listener = {};
	this.nodeevent_listener = {};
};
rclient.prototype.bind_hash = function(alternative_node) {
	var _rc = this;
	var ohc = function() {
		if (!location.hash.match(/^#?$/)) {
			var node = decodeURI(location.hash.replace(/^#/, ""));
			node = node.split(/,/);
			_rc.bind(node);
		} else if (typeof alternative_node !== "undefined") {
			_rc.bind(alternative_node)
		}
	};
	window.addEventListener("hashchange", ohc);
	ohc();
};
rclient.prototype.get_history_onbind = function() {
	var _rc = this;

	this.nodes.forEach(function(node) {
		_rc.get_history(node);
	});

};
rclient.prototype.cb_init = function() {
	console.log("Connection established");

	var _rc = this;
	this.nodes.forEach(function(node) {
		_rc.bind_one(node);
	});
	this.init_packets.forEach(function(data) {
		_rc.send(data);
	});


	this.list();
	
	this.event_emit("connect", {});
};
rclient.prototype.cb_close = function() {
	this.event_emit("disconnect", {});
};
rclient.prototype.recv = function(data) {
	if (Array.isArray(data)) {
		var _rc = this;
		data.forEach(function(d) {
			_rc.recv_single(d);
		});
	} else {
		this.recv_single(data);
	}
};
rclient.prototype.recv_single = function(data) {
	var needed_fields = {
		"data": ["node"],
		"dataset": ["data"],
		"history": ["node", "data"],
		"dests": ["data"]
	};
	if (data.hasOwnProperty("type")) {
		if (this._rpc_process(data.type, d.args, function() {})) {
			return true;
		}

		var type = data.type.toLowerCase();
		if (!needed_fields.hasOwnProperty(type)) {
			console.log("Received type unknown.");
			return;
		}
		for (var ni=0;ni<needed_fields[type].length;ni++) {
			var n = needed_fields[type][ni];
			if (!data.hasOwnProperty(n)) {
				console.log("Received packet. Field missing:", type, n);
				return;
			}
		}
		this.event_emit(type, data);
	}
};

rclient.prototype.event_emit = function(command, data) {
	if (typeof this.event_listener[command] !== "undefined" && Array.isArray(this.event_listener[command])) {
		for(var li=0; li<this.event_listener[command].length; li++) {
			var l = this.event_listener[command][li];
			if (typeof l === "function") {
				l(data, command);
			}
		}
	}
};
rclient.prototype.event_on = function(commands, callback) {
	if (!Array.isArray(commands))
		commands = [commands];
	var _rc = this;
	commands.forEach(function(command) {
		if (typeof _rc.event_listener[command] === "undefined" || !Array.isArray(_rc.event_listener[command])) {
			_rc.event_listener[command] = [];
		}
		_rc.event_listener[command].push(callback);
	});
};

rclient.prototype.nodeevent_clear = function() {
	for (var command in this.nodeevent_listener) {
		this.nodeevent_listener[command] = [];
	}
};
rclient.prototype.nodeevent_emit = function(command, data) {
	if (typeof this.nodeevent_listener[command] !== "undefined" && Array.isArray(this.nodeevent_listener[command])) {
		for(var li=0; li<this.nodeevent_listener[command].length; li++) {
			var l = this.nodeevent_listener[command][li];
			if (typeof l === "function") {
				l(data, command);
			}
		}
	} else {
		this.nodeevent_listener[command] = [];
	}
};
rclient.prototype.nodeevent_on = function(commands, callback) {
	if (!Array.isArray(commands))
		commands = [commands];
	var _rc = this;
	commands.forEach(function(command) {
		if (typeof _rc.nodeevent_listener[command] === "undefined" || !Array.isArray(_rc.nodeevent_listener[command])) {
			_rc.nodeevent_listener[command] = [];
		}
		_rc.nodeevent_listener[command].push(callback);
	});
};

rclient.prototype.init = function() {
	var _rc = this;
	this.ws = new pWebSocket(this.routeruri, function() {
		_rc.cb_init();
	}, function(data) {
		_rc.recv(data);
	}, function() {
		_rc.cb_close();
	});

	return this;
};
rclient.prototype.send = function(data) {
	if (this.ws !== null) {
		this.ws.sendjson(data);
	}
};
/* RPC functions from router */

/* Bind a callback to this object and create a reference to it */
rclient.prototype._rpc_bind = function(method, callback) {
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
rclient.prototype._rpc_bind_get = function(ref) {
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
rclient.prototype.rpc_reply = function(reply, ref, error, data) {
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
rclient.prototype._rpc_process = function(method, args, reply, object) {
	if (typeof object !== "object" || object === null) {
		object = this;
	}
	if (typeof object['rpc_' + method] == "function" &&
			typeof args !== "undefined" &&
			Array.isArray(args)) {
		args.unshift(reply);
		object['rpc_' + method].apply(this, args);
		return true;
	}
	return false;
};

/* Create a remote call object */
rclient.prototype._rpc_create_object = function(method) {
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


rclient.prototype.rpc = function(method) {
	var args = Array.prototype.slice.call(arguments);
	var object = this._rpc_create_object.apply(router, args);
	this.send(object);
};
rclient.prototype.node_rpc = function(node, method) {
	var args = Array.prototype.slice.call(arguments);
	//var node =
	args.shift();
	var object = this._rpc_create_object.apply(router, args);
	object.node = node;
	this.send(object);
};
rclient.prototype.send_init = function(data) {
	if (!Array.isArray(data))
		data = [data];

	console.log("send, init ", data);
	this.init_packets = this.init_packets.concat(data);
	this.send(data);
};
rclient.prototype.bind = function(node) {
	if (!Array.isArray(node))
		node = [node];
	this.nodes = this.nodes.concat(node);

	var _rc = this;
	node.forEach(function(n) {
		_rc.bind_one(n);
	});
};

rclient.prototype.bind_one = function(node) {
	console.log("bind: ", node);
	this.node_rpc(node, "bind");
};
rclient.prototype.data = function(node, value) {
	this.node_rpc(node, "data", new Date()/1000, value);
};
rclient.prototype.get_history = function(node, interval, callback) {
	if (!Array.isArray(node))
		node = [node];

	var _rc = this;
	node.forEach(function(n) {
		var cb = callback;
		if (typeof cb === "undefined") {
			cb = function(data) {
				this.event_emit("history", {"node": n, "data": data});
			}
		}

		console.log("get history: ", n);

		this.node_rpc(n, "get_history", interval, callback);
	});
};
rclient.prototype.history = function(node, interval) {
	if (!Array.isArray(node))
		node = [node];
	var _rc = this;
	node.forEach(function(n) {
		if (!_rc.hasOwnProperty("history_d") || !_rc.history_d.hasOwnProperty(n)) {
			_rc.get_history(n, {"maxentries": 30});
		} else {
			var data = _rc.history_d[node].get(interval);
			data.forEach(function(d) {
				_rc.nodeevent_emit(node, d);
			});
		}
	});
};
rclient.prototype.history_save = function(parent_path) {
	if (!this.hasOwnProperty("history_d")) {
		this.history_d = {};
	}
	this.event_filter_parent_path("data", parent_path, function(data, relative_name) {
		if (!this.history_d.hasOwnProperty(data.node)) {
			this.history_d[data.node] = new module_history.history(50*60);

			this.get_history(data.node, {"maxentries": 30});
			return; // do not save value.
		}
		// add history:
		if (!data.hasOwnProperty("add_history") ||
				!data.add_history) {
			this.history_d[data.node].add(data.time, data.value);
		}
	});
};
rclient.prototype.list = function(callback) {
	if (typeof callback === "undefined") {
		callback = function(data) {
			this.event_emit("dataset", {"data": data});
		}
	}
	this.rpc("list", callback);
};
rclient.prototype.get_dests = function(callback) {
	if (typeof callback === "undefined") {
		callback = function(data) {
			this.event_emit("dests", {"data": data});
		}
	}

	this.rpc("get_dests", callback);
};
rclient.prototype.connect = function(node, dnode) {
	this.node_rpc(node, "connect", dnode);
};
rclient.prototype.register = function(node, dest, id, obj) {
	this.node_rpc(node, "register", dest, id, obj);
};
rclient.prototype.unregister = function(node, rentry) {
	this.node_rpc(node, "unregister", rentry);
};
rclient.prototype.event_filter_parent_path = function(eventaction, parent_path, callback) {
	if (typeof parent_path === "undefined")
		parent_path = "";
	var _rc = this;
	this.event_on(eventaction, function(data) {
		var regex = new RegExp("^" + RegExp.quote(parent_path) + "(.*)$", '');
		var found = data.node.match(regex);
		if (found) {
			var relative_name = found[1];
			callback.call(_rc, data, relative_name);
		}
	});
};

rclient.prototype.react_namespace = function(parent_path, cb_value) {
	this.event_filter_parent_path("data", parent_path, function(data, relative_name) {
		if (data.value === null)
			return;

		var id = relative_name.replace(/\//g, '\\/').replace(/[^\\\/A-Za-z0-9_-]/g, '');
		var $elem = $("#" + id);

		var value = data.value;
		if (typeof cb_value === "function") {
			value = cb_value(value, $elem);
		}

		$elem
			.attr("data-node", node)
			.attr("data-time", data.time)
			.attr("data-value", value)
			.text(value);
	});
};
rclient.prototype.react_event = function(parent_path) {
	this.event_filter_parent_path("data", parent_path, function(data, relative_name) {
		if (data.value === null)
			return;
			
		this.nodeevent_emit(relative_name, data);
	});
};

