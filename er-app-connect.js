
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
exports.re_map_value = function(value, metadata, nmetadata) {
	return this.map_value(value, metadata, nmetadata);
};

exports.init = function(node, app_config, main, host_info) {
	var _this = this;

	var enable = true;

	var last_time = undefined;
	var snode = null;
	var tnode = null;

	var target = this._target;

	var s = this._source.subscribe(function() {
		if (this.time === null || this.value === null || !enable)
			return;
		if (!tnode)
			return;

		if (!last_time || this.time > last_time) {
			var value = _this.map_value(this.value,
					this.metadata, tnode.metadata);

			if (typeof value === "undefined")
				return;

			last_time = this.time;
			tnode.rpc("set", value, this.time);
		}
	});
	var p = target.subscribe(function() {
		if (this.time === null || this.value === null || !enable)
			return;
		if (!snode)
			return;

		if (!last_time || this.time > last_time) {
			var value = _this.re_map_value(this.value,
					this.metadata, snode.metadata);

			if (typeof value === "undefined")
				return;

			last_time = this.time;
			snode.rpc("set", value, this.time);
		}
	});
	var sr=this._source.ready("announce", function(method, initial, update){
		if (update) return;

		snode = this;

		return [function() {
			snode = null;
		}];
	});
	var pr=target.ready("announce", function(method, initial, update) {
		if (update) return;

		tnode = this;

		return [function() {
			tnode = null;
		}];
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
		"type": "connect.rpc",
		"rpc": {
			"set": {
				"desc": "Enable",
				"args": [ true ]
			}
		}
	});

	return [node, s, p, sr, pr];
};
