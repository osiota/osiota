exports.init = function(node, app_config, main, host_info) {
	var basename = app_config.basename;
	var delay = app_config.delay;
	var value = app_config.value;

	if (typeof delay === "undefined")
		delay = 1000;
	if (typeof value === "undefined")
		value = 5;

	setInterval(function(node, basename, value) {
		var v = value;
		if (typeof value === "function") {
			v = value();
		}
		node(basename).publish(undefined, v);
	}, delay, node, basename, value);

};
