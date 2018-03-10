
exports.map_value = function(value, metadata, nmetadata) {
	var limits = metadata.values;
	var nlimits = nmetadata.values;

	if (!Array.isArray(limits) || limits.length < 2)
		limits = [0, 255];
	if (!Array.isArray(nlimits) || nlimits.length < 2)
		nlimits = [0, 255];

	if (limits[0] != nlimits[0] || limits[1] != nlimits[1]) {
		value = (value - limits[0])
				*(nlimits[1]-nlimits[0])
				/(limits[1]-limits[0])
			+nlimits[0];
	}
	// check boolean
	return value;
};

exports.init = function(node, app_config, main, host_info) {
	var _this = this;

	var enable = true;

	var last_time = undefined;
	var pnode = null;

	var s = this._source.subscribe(function() {
		if (this.value === null)
			return;

		if (!enable)
			return;

		if (!pnode)
			return;

		var value = _this.map_value(this.value,
				this.metadata,
				pnode.metadata);

		last_time = this.time;
		pnode.rpc("set", value, this.time);
	});

	node.rpc_set = function(reply, value, time) {
		enable = value;
		this.publish(time, value);
		reply(null, "okay");
	};
	node.rpc_publish = function(reply, time, value) {
		return this.rpc_set(reply, value, time);
	};

	node.announce({
		"type": "forward.rpc",
		"rpc": {
			"set": {
				"desc": "Enable",
				"args": [ true ]
			}
		}
	});
	var target = node.parentnode;
	if (typeof app_config.target === "string") {
		target = node.node(app_config.target);
	}

	var sr=target.ready("announce", function(method, initial,
				update) {
		if (update) return;

		pnode = this;
		var s = this.subscribe(function() {
			if (this.time === null) return;
			if (!last_time || this.time > last_time) {
				var value = _this.map_value(this.value,
						this.metadata,
						_this._source.metadata);
				_this._source.rpc("set", value,
						this.time);
				last_time = this.time;
			}
		});

		return [s, function() {
			pnode = null;
		}];
	});

	return [node, sr, s];
};
