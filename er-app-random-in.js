
exports.init = function(node, app_config, main, host_info) {
	var basename = app_config.basename;
	var delay = app_config.delay;
	var cmin = app_config.cmin;
	var cmax = app_config.cmax;
	var exp = app_config.exp;
	var round = app_config.round;

	if (typeof delay === "undefined")
		delay = 1000;
	if (typeof cmin === "undefined")
		cmin = 0;
	if (typeof cmax === "undefined")
		cmax = 100;
	if (typeof exp !== "number")
		exp = 5;
	if (typeof round !== "number")
		round = null;

	var last_value = 0.5;
	setInterval(function(node, basename, cmin, cmax) {
		var v = Math.random();
		v = last_value + (v-0.5)/exp;
		v = Math.max(Math.min(v, 1), 0);
		last_value = v;

		v = v * (cmax - cmin) + cmin;
		if (round !== null) {
			v = Math.round( v * Math.pow(10, round) ) / Math.pow(10, round);
		}
		node(basename).publish(undefined, v);
	}, delay, node, basename, cmin, cmax);

};


