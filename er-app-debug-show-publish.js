
exports.init = function(node, app_config, main) {
	var s = this._source.subscribe_announcement("announce", function(
					node, method, initial, update) {
		if (update) return;

		console.info("ANNOUNCE", method, node.name, node.metadata);

		return node.subscribe(function() {
			console.info("PUBLISH", node.name, node.time,
				node.value);
		});
	});
	return s;
}
