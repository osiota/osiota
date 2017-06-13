
exports.init = function(node, app_config, main, host_info) {
	for (var cnodename in app_config) {
		if (app_config.hasOwnProperty(cnodename) &&
				Array.isArray(app_config[cnodename]) &&
				app_config[cnodename].length >= 1) {
			var cnode = node.node(cnodename);

			// try?
			cnode.rpc.apply(cnode, app_config[cnodename]);
		}
	}
};
