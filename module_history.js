
var History = require('./module_history_class.js').history;

exports.init = function(router) {
	router.on("create_new_node", function(node) {
		node.history = new History(3000);
		node.on("set", function(time, value, only_if_differ, do_not_add_to_history) {
			// add history:
			if (typeof do_not_add_to_history === "undefined" || !do_not_add_to_history) {
				this.history.add(time, value);
			}
		});
	});
};

