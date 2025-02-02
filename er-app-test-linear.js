exports.init = function(node, app_config, main, host_info) {
	node.announce({
		"type": "linear.data"
	});

	let delay = 100;
	if (typeof app_config.delay === "number") {
		delay = app_config.delay;
	}

	let i = 0;
	const tid = setInterval(function() {
		i++;
		if(i === 100)
			i = 0;
		node.publish(undefined, i);
	}, delay);

	return [node, tid];
};
