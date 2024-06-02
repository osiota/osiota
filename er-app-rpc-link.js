
exports.meta_type = "link.rpc";

exports.map_event = function(e) {
	return e;
};

exports.node_set = function(node, value, time, app_config) {
	value = this.map_event(value, time, app_config);
	return node.rpc(app_config.rpc_function || "set", value, time);
};

exports.init = function(node, app_config, main, host_info) {
	var _this = this;

	node.announce([{
		"type": this.meta_type
	}, app_config.metadata]);

	var sr = this._target.ready("announce", function(method,
					initial, update) {
		var tnode = this;
		if (update) return;

		return _this._source.subscribe(function(
				do_not_add_to_history, initial){
			if (initial) return;
			_this.node_set(tnode, this.value, this.time,
					app_config);
			// publish for debugging?
			//node.publish(this.time, time.value);
		});
	});

	return [sr, node];
};
