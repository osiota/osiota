/*
 * TODO:
 * modul artnet aendern:
 *
 * that.send(universe, 512, callback);
 */

exports.init = function(router, basename, options, nodes) {
	var artnet = require('artnet')(options);

	router.dests.artnet = function(node) {
		var channel = this.id;
		var value = node.value;
		if (value !== null) {
			value *= 1;
			artnet.set(channel, value);
		}

		var dnode = node.name.replace(/_s$|@s$/, "");
		router.node(dnode).publish(node.time, value);
	};

	for (var n in nodes) {
		var channel = nodes[n];

		router.node(basename + n + '_s').register('artnet', channel);
	}
};

