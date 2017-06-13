
exports.init = function(node, app_config, main, host_info) {
	if (typeof app_config !== "object") {
		app_config = {};
	}

	node.announce({
		display: "hidden",
		app: "webstate"
	});

	node.rpc_send_state = function(reply, state) {
		this.publish(undefined, state);
	};

	return [node];
};

