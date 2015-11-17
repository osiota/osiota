
exports.init = function(router, basename) {
	router.dests.multiply = function(node) {
		var obj = this.obj;
		if (typeof obj !== "object" || Object.prototype.toString.call(obj) !== '[object Array]') {
			obj = [obj];
		}
		var value = 1*node.value;
		for (var k=0;k<obj.length;k++) {
			var node2_name = obj[k];
			var n = router.get(node2_name, true);

			if (n.value !== null) {
				value *= 1*n.value;
			}
		}
		router.publish(this.id, node.time, value);
	};
};

