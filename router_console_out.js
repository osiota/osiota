
exports.init = function(router, basename) {
	router.dests.console = function(node) {
		console.log(this.id + " [" + node.time + "]:\t" + node.value);
	};
}

