
exports.meta_type = "link.rpc";

exports.map_event = function(e) {
	return e;
};

exports.node_set = function(node, value, time, app_config) {
	value = this.map_event(value, time, app_config);
	return node.rpc("set", value, time);
};

exports.init = function(node, app_config, main, host_info) {
	var _this = this;

	node.announce([{
		"type": this.meta_type
	}, app_config.metadata]);

	if (!node.parentnode) {
		return;
	}
	var sr = node.parentnode.ready("announce", function(method,
					initial, update) {
		var _parent = this;
		if (update) return;

		return _this._source.subscribe(function(
				do_not_add_to_history, initial){
			if (initial) return;
			_this.node_set(_parent, this.value, this.time,
					app_config);
		});
	});

	return [sr, node];
};
