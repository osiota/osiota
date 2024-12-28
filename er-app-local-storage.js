if (Storage) {
	Storage.prototype.setObject = function(key, value) {
		if (typeof value === "object") {
			value = JSON.stringify(value);
		}
		this.setItem(key, value);
	}

	Storage.prototype.getObject = function(key) {
		var value = this.getItem(key);
		try {
			value = JSON.parse(value);
		} catch(err) {}
		return value;
	}

	Storage.prototype.forEachKey = function(callback) {
		for (var i = 0; i < this.length; i++) {
			callback(this.key(i));
		}
	};
}
exports.init = function(node, app_config, main, host_info) {
	if (!window || !window.localStorage) return;

	const storage = window.localStorage;

	const map = node.map(app_config, {
		"map_extra_elements": true,
		"map_key": function(c) {
			var name = c.map;
			return name;
		},
		"map_initialise": function(n, metadata, c) {
			n.rpc_set = function(reply, value, time) {
				storage.setObject(c.map, value);
			};
			n.announce([{
				"type": "object.storage"
			}, metadata]);
		},
	});

	node.rpc_saveObject = function(reply, key, value) {
		storage.setObject(key, value);
		reply(null, "okay");
	};

	storage.forEachKey(function(key) {
		var c = storage.getObject(key);
		var n = map.node(key);
		if (n) {
			n.publish(undefined, c);
		}
	});

	const storageEvent = function(event) {
		var key = event.key;
		var n = map.node(key);
		var c = event.newValue;
		if (n) {
			n.publish(undefined, c);
		}
	};
	window.addEventListener("storage", storageEvent);

	return [node, map, function() {
		window.removeEventListener("storage", storageEvent);
	}];
};

