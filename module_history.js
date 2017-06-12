
var HG = require('./module_history_global.js');

exports.init = function(router, config) {

	var History = HG.get_history_module(config);

	router.on("create_new_node", function(node) {
		node.history = new History(node, config);

		node.on("set", function(time, value, only_if_differ, do_not_add_to_history) {
			// add history:
			if (typeof do_not_add_to_history === "undefined" || !do_not_add_to_history) {
				this.history.add(time, value);
			}
		});

		node.subscribe_h = function(object, timeout, config) {
			if (typeof config !== "object")
				config = {};
			config.totime = this.time;
			var s = this.get_history_on_initialsync(config,
					function(hdata) {
				hdata.forEach(function(d) {
					object.call(d, true, true);
				});
				node.subscribe(object);
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
	});
};

