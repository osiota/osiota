exports.init = function(node, app_config, main, host_info) {
	node.announce({
		"type": "linear.data"
	});

	var delay = 100;
	if (typeof app_config.delay === "number") {
		delay = app_config.delay;
	}
	
	var i = 0;
	var tid = setInterval(function() {
		i++;
		if(i === 100)
			i = 0;
		node.publish(undefined, i);
	}, delay);

	return [node, tid];
};
