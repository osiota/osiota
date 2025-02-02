
exports.init = function(node, app_config, main, host_info) {
	let value = 1;
	if (typeof app_config.value === "object") {
		value = app_config.value;
	}

	node.announce([{
		"type": "unknown.data"
	}, app_config.metadata]);

	let state = 0;
	const s = this._source.subscribe(function() {
		state = this.value;
	});

	const tid = setInterval(function() {
		node.publish(undefined, value * state);
	}, 1000);

	return [s, tid];
};
