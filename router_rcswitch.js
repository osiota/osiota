
exports.init = function(router, basename, nodes) {

	if (!router.dests.hasOwnProperty('execcommand')) {
		require('./router_execcommand.js').init(router);
	}

	router.dests.rcswitch = function(id, time, value, name, obj) {
		var command = '/home/pi/switch ' + id;
		router.dests.execcommand(command, time, value, name, obj);
		var dnode = name.replace(/_s$|@s$/, "");
		router.route(dnode, time, value);
	};

	for (var n in nodes) {
		//code: '10011-4'
		var code = nodes[n];

		router.register(basename + n + '_s', 'rcswitch', code);
	}
};

