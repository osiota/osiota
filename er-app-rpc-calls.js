
exports.init = function(node, app_config, main, host_info) {
	for (const cnodename in app_config) {
		if (app_config.hasOwnProperty(cnodename) &&
				Array.isArray(app_config[cnodename]) &&
				app_config[cnodename].length >= 1) {
			const cnode = node.node(cnodename);

			// try?
			cnode.rpc.apply(cnode, app_config[cnodename]);
		}
	}
};
