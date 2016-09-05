

exports.init = function(router, history_type, history_config) {
	var History;
	if (history_type == "ram")
		History = require('./module_history_class.js').history;
	else if (history_type == "levelup")
		History = require('./module_history_class_levelup.js').history;
	else
		throw Exception("Not history type defined.");

	router.on("create_new_node", function(node) {
		node.history = new History(node.name, history_config);

		node.on("set", function(time, value, only_if_differ, do_not_add_to_history) {
			// add history:
			if (typeof do_not_add_to_history === "undefined" || !do_not_add_to_history) {
				this.history.add(time, value);
			}
		});

		node.subscribe_h = function(object, timeout) {
			this.get_history_on_initialsync({
				"totime": this.time
			}, function(hdata) {
				hdata.forEach(function(d) {
					object.call(d, true, true);
				});
				node.subscribe(object);
			}, timeout);
			return object;
		};

		node.get_history = function(config, callback) {
			this.history.get(config, callback);
		};
		node.history.synced = false;
		node.get_history_on_initialsync = function(config, callback, timeout) {
			if (typeof timeout !== "number") timeout = 1000;
			if (this.connection && !this.history.synced) {
				var _this = this;
				this.once_timeout("history_synced", function(was_timedout) {
					_this.get_history(config, callback);
				}, timeout);
			} else {
				this.get_history(config, callback);
			}
		};

		/* register remote procedure calls */
		node.rpc_history = function(reply, config) {
			this.get_history(config, function(data) {
				reply(null, data);
			});
		};
	});
};

