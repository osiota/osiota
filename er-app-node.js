
exports.init = function(app_node, app_config, main, host_info) {
	if (typeof app_config.metadata === "object") {
		return app_node.announce(app_config.metadata);
	}
};
