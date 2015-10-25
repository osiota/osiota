/*
 * TODO:
 * modul artnet aendern:
 *
 * that.send(universe, 512, callback);
 */

exports.init = function(router, basename, options, nodes) {
	var artnet = require('artnet')(options);

	router.dests.artnet = function(id, time, value, name, obj) {
		channel = id;
		if (value !== null) {
			value *= 1;
			artnet.set(channel, value);
		}

		var dnode = name.replace(/_s$|@s$/, "");
		router.route(dnode, time, value);
	};

	for (var n in nodes) {
		var channel = nodes[n];

		router.register(basename + n + '_s', 'artnet', channel);
	}
};

