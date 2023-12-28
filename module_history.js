
var HG = require('./module_history_global.js');

exports.setup = function(router, save_history, history_config) {
	// Load history module
	var dbdir = "./.level_db/";
	if (save_history && typeof save_history === "object") {
		if (typeof save_history.dbdir === "string") {
			dbdir = save_history.dbdir;
		}
	}
	if (!history_config)
	history_config = {
		"type": "global",
		"submodules": [{
			"type": "timebase",
			"interval": 60,
			"submodules": [{
				"type": "timebase",
				"interval": 3600,
				"submodules": [{
					"type": "timebase",
					"interval": 3600*24,
					"submodules": [{
						"type": "file",
						"dbdir": dbdir,
						"filename": "1d.vdb"
					}]
				},{
					"type": "file",
					"dbdir": dbdir,
					"filename": "60min.vdb"
				}]
			},{
				"type": "file",
				"dbdir": dbdir,
				"filename": "60sec.vdb"
			}]
		},{
			"type": "memory",
			"max_data": 3000
		},{
			"type": "file",
			"dbdir": dbdir,
			"filename": "0.vdb"
		},{
			"type": "remote"
		}]
	};
	if (save_history) {
		require('./module_history_class_file.js');
	}
	exports.init(router, history_config);

	/* local
	this.history_config = {
		"type": "global",
		"submodules": [{
			"type": "filter",
			"interval": 0,
			"submodules": [{
				"type": "memory",
				"max_data": 3000
			}]
		},{
			"type": "remote"
		}]
	};
	*/
}

exports.init = function(router, config) {

	var History_info = HG.get_history_module({
		"type": "global",
		"submodules": [{
			"type": "filter",
			"interval": 0,
			"submodules": [{
				"type": "memory",
				"max_data": 3000
			}]
		},{
			"type": "remote"
		}]
	});
	var History_data = HG.get_history_module(config);

	router.on("create_new_node", function(node) {
		node.ready("announce", function(method, initial, update) {
			if (update) return;

			if (this.metadata && typeof this.metadata.type === "string" && this.metadata.type.match(/\.data$/)) {
				exports.init_node(History_data, router, node, config);
			} else {
				exports.init_node(History_info, router, node, config);
			}
		});
	});
};

exports.init_node = function(History, router, node, config) {
	if (node.history) return;

	node.history = new History(node, config);

	node.on("set", function(time, value, only_if_differ, do_not_add_to_history) {
		// add history:
		if (typeof do_not_add_to_history === "undefined" || !do_not_add_to_history) {
			this.history.add(time, value);
		}
	});

	node.subscribe_h = function(callback, timeout, config) {
		var object = callback.bind(this);
		if (typeof config !== "object")
			config = {};
		config.totime = this.time;
		var s = this.get_history_on_initialsync(config,
			function(hdata) {
				hdata.forEach(function(d) {
					object.call(d, true, true);
				});
				// remove function is added in subscribe:
				var s2 = node.subscribe(object);
				object.remove = s2.remove;

			}, timeout);
		if (typeof s !== "undefined") {
			object.remove = s.remove;
		}

		return object;
	};

	node.get_history = function(config, callback) {
		this.history.get(config, callback);
	};
	node.history.synced = false;
	node.get_history_on_initialsync = function(config, callback, timeout) {
		// this = node

		if (typeof timeout !== "number") timeout = 1000;
		if (this.connection && !this.history.synced) {
			var _this = this;
			return this.once_timeout("history_synced",
				function(was_timedout) {
					_this.get_history(config, callback);
				}, timeout);
		} else {
			this.get_history(config, callback);
			return undefined;
		}
	};

	/* register remote procedure calls */
	node.rpc_history = function(reply, config) {
		this.get_history(config, function(data) {
			reply(null, data);
		});
	};

	node.purge_history = function() {
		node.history = new History(node, config);
	};
};

