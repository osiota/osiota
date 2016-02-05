
exports.init = function(router, basename) {
	router.dests.console = function(node, relative_name) {
		console.log(this.id + relative_name + " [" + node.time + "]:\t" + node.value);
	};
	router.node(basename).register('console', basename);
}

