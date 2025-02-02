
exports.init = function(node, app_config, main, host_info) {
	let delay = 1000;
	let cmin = 0;
	let cmax = 100;
	let exp = 5;
	let round = null;
	let metadata = {
		"type": "random.data"
	};

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
	if (typeof app_config.metadata === "object")
		metadata = app_config.metadata;

	node.announce(metadata);

	let last_value = 0.5;
	const tid = setInterval(function() {
		let v = Math.random();
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


