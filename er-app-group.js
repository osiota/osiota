
exports.init = function(node, app_config, main, host_info) {
	var source = this._source;

	return source.ready("announce", function(method, initial, update) {
		if (update) return;

		app_config.rpc.forEach(function(rpc) {
			node["rpc_" + rpc] = function(reply) {
				var args =Array.prototype.slice.call(arguments, 1);

				args.unshift(rpc);
				args.push(reply);
				source.rpc.apply(source, args);
			};
		});

		var metadata = JSON.parse(JSON.stringify(source.metadata));
		metadata.groupnode = true;
		node.announce(metadata);

		return node;
	});
};
