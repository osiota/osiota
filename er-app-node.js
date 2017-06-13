
exports.init = function(node, app_config, main, host_info) {
	if (typeof app_config.metadata === "object") {
		node.announce(app_config.metadata);
		return node;
	}
};
