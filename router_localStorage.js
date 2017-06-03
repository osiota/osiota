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
			callback(localStorage.key(i));
		}
	};
}
exports.init = function(router, basename, storage_name) {
	if (!window || !window.localStorage) return;

	if (typeof storage_name !== "string") {
		storage_name = router.name;
	}

	var lS = window.localStorage;
	var regex = new RegExp("^"+ RegExp.quote(storage_name) + "#(/.*)$", '');
	lS.forEachKey(function(key) {
		try {
			var nodename = router.nodename_transform(key, basename,
					storage_name + '#');
			var n = router.node(nodename);
			var c = lS.getObject(key);

			if (typeof c.metadata === "object")
				n.announce(c.metadata);

			n.publish(c.time, c.value);
		} catch(e) {}
	});

	router.node(basename).subscribe_announcement(function(node) {
		node.subscribe(function() {
			if (node.value !== null) {
				var key = router.nodename_transform(node.name,
						storage_name + '#', basename);
				lS.setObject(key, {
					"time": node.time,
					"value": node.value,
					"metadata": node.metadata
				});
			}
		});
	});
};

