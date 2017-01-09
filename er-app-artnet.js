/*
 * TODO:
 * modul artnet aendern:
 *
 * that.send(universe, 512, callback);
 */

exports.init = function(node, app_config, main, host_info) {
	var options = app_config.options;
	var nodes = app_config.nodes;

	var artnet = require('artnet')(options);

	for (var n in nodes) {
		var channel = nodes[n];
		var default_value = null;
		var nn = node.node(n);

		if (Array.isArray(channel) && channel.length >= 2) {
			default_value = channel[1];
			channel = channel[0];
		}

		(function(nn, channel) {
		nn.rpc_set = function(reply, value) {
			if (typeof value !== "number")
				value *= 1;
			if (value !== null)
				artnet.set(channel, value);

			this.publish(undefined, value);

			reply(null, "ok");
		};
		})(nn, channel);

		if (nn.value !== null) {
			default_value = nn.value;
		}
		if (default_value !== null) {
			nn.rpc_set(function() {}, default_value);
		}
	}
};

