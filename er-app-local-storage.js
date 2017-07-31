if (Storage) {
	Storage.prototype.setObject = function(key, value) {
		this.setItem(key, JSON.stringify(value));
	}

	Storage.prototype.getObject = function(key) {
		var value = this.getItem(key);
		return value && JSON.parse(value);
	}

	Storage.prototype.forEachKey = function(callback) {
		for (var i = 0; i < this.length; i++) {
			callback(this.key(i));
		}
	};
}
exports.init = function(node, app_config, main, host_info) {
	var router = main.router;

	if (!window || !window.localStorage) return;

	var storage_name = main.router.name;
	if (typeof app_config.storage_name !== "string") {
		storage_name = app_config.storage_name;
	}

	var nodes = [];

	var lS = window.localStorage;
	lS.forEachKey(function(key) {
		try {
			var nodename = router.nodename_transform(key, node.name,
					storage_name + '#');
			var n = router.node(nodename);
			var c = lS.getObject(key);

			if (typeof c.metadata === "object")
				n.announce(c.metadata);

			nodes.push(n);

			n.publish(c.time, c.value);
		} catch(e) {}
	});

	var s = node.subscribe_announcement("announce", function(n, method,
				initial, update) {
		if (update) return;

		return n.subscribe(function() {
			if (n.value === null) {
				return;
			}
			var key = router.nodename_transform(n.name,
					storage_name + '#', node.name);
			lS.setObject(key, {
				"time": n.time,
				"value": n.value,
				"metadata": n.metadata
			});
		});
	});

	return [s, nodes];
};

