
exports.init = function(node, app_config, main, host_info) {
	var _this = this;
	
	node.announce({
		"type": "link.rpc"
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
			_parent.rpc("set", this.value);

		});
	});

	return [s, node];
};
