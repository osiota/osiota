exports.inherit = ["rpc-link"];

exports.node_set = function(node, value, time, app_config) {
	if (!value) return;
	return node.rpc(app_config.rpc_function || "toggle", time);
};

