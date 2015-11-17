
exports.init = function(router, basename) {
	router.dests.function = function(node, relative_name, do_not_add_to_history) {
		if (typeof this.obj === "function") {
			this.obj.call(this, node, relative_name, do_not_add_to_history);
		}
	};
}

