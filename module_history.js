

exports.init = function(router, history_type) {
	var History;
	if (history_type == "ram")
		History = require('./module_history_class.js').history;
	else if (history_type == "levelup")
		History = require('./module_history_class_levelup.js').history;
	else
		throw Exception("Not history type defined.");

	router.on("create_new_node", function(node) {
		node.history = new History(3000);
		node.on("set", function(time, value, only_if_differ, do_not_add_to_history) {
			// add history:
			if (typeof do_not_add_to_history === "undefined" || !do_not_add_to_history) {
				this.history.add(time, value);
			}
		});
		node.get_history = function(interval, callback) {
			this.history.get(interval, callback);
		}
		/* register remote procedure calls */
		node.rpc_get_history = function(reply, interval) {
			this.get_history(interval, function(data) {
				reply(null, data);
			});
		}
		node.rpc_history = function(respond, hdata) {
			console.log("history:", hdata);
		};
	});
};

