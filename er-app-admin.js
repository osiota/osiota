
exports.init = function(node, app_config, main, host_info) {
	setTimeout(function() {
		for (var app in main.apps) {
			console.log("app", app);
			node.node(app);
		}
	}, 1000);
};
