exports.init = function(node, app_config, main, host_info) {
	// default data:
	var delay = 1000;
	var value = 5;

	var metadata = {
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

	var tid = setInterval(function() {
		var v = value;
		if (typeof v === "function") {
			v = v();
		}
		node.publish(undefined, v);
	}, delay);

	return [node, tid];
};

