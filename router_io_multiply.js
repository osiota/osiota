
exports.init = function(router, basename) {
	router.dests.multiply = function(id, time, value, name, obj) {
		if (typeof obj !== "object" || Object.prototype.toString.call(obj) !== '[object Array]') {
			obj = [obj];
		}
		value *= 1;
		for (var k=0;k<obj.length;k++) {
			var node2_name = obj[k];
			var node = router.get(node2_name);

			if (node.hasOwnProperty("value") && node.value !== null) {
				value *= 1*node.value;
			}
		}
		router.route(id, time, value);
	};
};

