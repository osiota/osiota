exports.init = function(router, basename, delay, value) {
	if (typeof delay === "undefined")
		delay = 1000;
	if (typeof value === "undefined")
		value = 5;

	setInterval(function(router, basename, value) {
		var v = value;
		if (typeof value === "function") {
			v = value();
		}
		router.node(basename).publish(undefined, v);
	}, delay, router, basename, value);

};
