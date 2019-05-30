
exports.init = function(node, app_config, main, host_info) {
	var metadata = {
		"type": "unknown.data"
	};
	if (typeof app_config.metadata === "object") {
		metadata = app_config.metadata;
	}

	var value = 0;
	if (typeof app_config.metadata === "object") {
		value = app_config.value;
	}

	node.announce(metadata);
	
	var state = 0;
	var s = this._source.subscribe(function() {
		state = this.value;
	});

	var tid = setInterval(function() {
		node.publish(undefined, value * state);
	}, 1000);

	return [s, tid];
};
