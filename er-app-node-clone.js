
exports.init = function(node, app_config, main, host_info) {
	node.connection = {
		node_rpc: function(node, method) {
			// ws.node_rpc(node, method, ...);
			const args = Array.prototype.slice.call(arguments, 2);
			const reply = args.pop();
			return source._rpc_process(method, args, reply);
		},
	};
	node.announce(app_config.metadata);

	const source = this._source;
	const sr = source.ready("announce", function(method, initial, update) {
		node.announce([source.metadata, app_config.metadata], true);
		const s = source.subscribe(function(dnath, s_initial) {
			node.publish(this.time, this.value, false, dnath, s_initial);
		});
		return [s, function() {
			if (node.metadata)
				node.announce(app_config.metadata, true);
		}];
	});
	/*
	node._rpc_process = function(method, args, reply, object) {
		return source._rpc_process(method, args, reply, object);
	};
	*/

	return [function() {
		node.connection = null;
	}, node, sr];
};
