
exports.map_event = function(e) {
	return e;
};

exports.meta_type = "link.rpc";

exports.init = function(node, app_config, main, host_info) {
	var _this = this;

	node.announce({
		"type": this.meta_type
	});

	if (!node.parentnode) {
		return;
	}
	var sr = node.parentnode.ready("announce", function(method,
					initial, update) {
		var _parent = this;
		if (update) return;

		return _this._source.subscribe(function(
				do_not_add_to_history, initial){
			_parent.rpc("set",
				_this.map_event(this.value),
				this.time);

		});
	});

	return [sr, node];
};
