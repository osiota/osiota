
exports.init = function(node, app_config, main, host_info) {
	var delay = 1000;
	var cmin = 0;
	var cmax = 100;
	var exp = 5;
	var round = null;

	if (typeof app_config.delay === "number")
		delay = app_config.delay;
	if (typeof app_config.cmin === "number")
		cmin = app_config.cmin;
	if (typeof app_config.cmax === "number")
		cmax = app_config.cmax;
	if (typeof app_config.exp === "number")
		exp = app_config.exp;
	if (typeof app_config.round === "number")
		round = app_config.round;

	var last_value = 0.5;
	var tid = setInterval(function() {
		var v = Math.random();
		v = last_value + (v-0.5)/exp;
		v = Math.max(Math.min(v, 1), 0);
		last_value = v;

		v = v * (cmax - cmin) + cmin;
		if (round !== null) {
			v = Math.round( v * Math.pow(10, round) ) / Math.pow(10, round);
		}
		node.publish(undefined, v);
	}, delay);

	return [node, tid];
};


