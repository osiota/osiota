
exports.init = function(node, app_config, main, host_info) {
	if (typeof app_config !== "object") {
		app_config = {};
	}
	for (var cnodename in app_config) {
		if (app_config.hasOwnProperty(cnodename) &&
				Array.isArray(app_conifg[cnodename]) &&
				app_config[cnodename].length >= 1) {
			var cnode = main.router.node(cnodename);

			// try?
			cnode.rpc.apply(cnode, app_config[cnodename]);
		}
	}
};
