
exports.init = function(router, basename, nodes) {

	if (!router.dests.hasOwnProperty('execcommand')) {
		require('./router_execcommand.js').init(router);
	}

	router.dests.rcswitch = function(node) {
		var command = './helper/switch ' + this.id;
		var rentry = {};
		rentry.id = command;
		rentry.obj = this.obj;
		router.dests.execcommand.call(rentry, node);
		var dnode = node.name.replace(/_s$|@s$/, "");
		router.publish(dnode, node.time, node.value);
	};

	for (var n in nodes) {
		//code: '10011-4'
		var code = nodes[n];

		router.register(basename + n + '_s', 'rcswitch', code);
	}
};

