exports.init = function(node, app_config, main, host_info) {
	// default data:
	let delay = 1000;
	let value = 5;

	let metadata = {
		"type": "staticin.data"
	};

	// arguments:
	if (typeof app_config.delay === "number")
		delay = app_config.delay;
	if (typeof app_config.value === "number")
		value = app_config.value;
	if (typeof app_config.metadata === "object") {
		metadata = app_config.metadata;
	}

	node.announce(metadata);

	const tid = setInterval(function() {
		let v = value;
		if (typeof v === "function") {
			v = v();
		}
		node.publish(undefined, v);
	}, delay);

	return [node, tid];
};

