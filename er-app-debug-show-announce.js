
exports.init = function(node, app_config, main) {
	var s = this._source.subscribe_announcement(function(
					node, method, initial, update) {
		console.info("ANNOUNCE:", method, node.name, update,
				node.metadata);
	});
	return s;
}
