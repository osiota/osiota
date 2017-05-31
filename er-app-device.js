
exports.init = function(app_node, app_config, main, host_info) {

	if (typeof app_config.metadata !== "object") {
		app_config.metadata = {};
	}
	app_config.metadata.type = "device.object";

	node.announce(app_config.metadata);

	if (Array.isArray(app_config.app)) {
		app_config.app.forEach(function(struct) {
			main.startup_struct(app_node, struct, main.router.name,
					main._config.auto_install);
		});
	}
};
