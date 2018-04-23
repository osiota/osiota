
exports.init = function(node, app_config, main) {
	var s = this._source.subscribe_announcement("announce", function(
					node, method, initial, update) {
		if (update) return;

		console.log("ANNCOUNCE", method, node.name);

		return node.subscribe(function() {
			console.log("PUBLISH", node.name, node.time, node.value);
		});

	});
	return s;
}
