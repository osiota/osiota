
exports.init = function(router, basename, delay, cmin, cmax) {
	if (typeof delay === "undefined")
		delay = 1000;
	if (typeof cmin === "undefined")
		cmin = 0;
	if (typeof cmax === "undefined")
		cmax = 100;

	var last_value = (cmax - cmin);
	setInterval(function(router, basename, cmin, cmax) {
		var v = Math.random() * (cmax - cmin) + cmin;
		v = last_value + (v-(cmax-cmin)/2)/5;
		v = Math.max(Math.min(v, cmax), cmin);
		last_value = v;
		var time = new Date() / 1000;
		router.node(basename).publish(time, v);
	}, delay, router, basename, cmin, cmax);

};


