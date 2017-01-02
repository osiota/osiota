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
		let channel = nodes[n];

		node(n).rpc_set(function(value) {
			if (typeof value !== "number")
				value *= 1;
			if (value !== null)
				artnet.set(channel, value);

			this.publish(undefined, value);
		});
	}
};

