
exports.init = function(router, basename) {
	router.dests.multiply = function(id, time, value, name, obj) {
		var node2_name = obj;
		var node = r.get(node2_name);
		if (node.hasOwnProperty("value") && node.value !== null) {
			value *= 1000;
			value *= node.value;
			r.route(id, time, value);
		}
	};
};

