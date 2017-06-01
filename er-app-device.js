
exports.init = function(app_node, app_config, main, host_info) {

	if (typeof app_config.metadata !== "object") {
		app_config.metadata = {};
	}
	app_config.metadata.type = "device.object";

	app_node.announce(app_config.metadata);
};
