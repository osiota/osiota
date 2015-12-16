
exports.init = function(router, basename) {
	router.dests.multiply = function(node, relative_name) {
		if (relative_name !== "") return;

		var obj = this.obj;
		if (typeof obj !== "object" || Object.prototype.toString.call(obj) !== '[object Array]') {
			obj = [obj];
		}
		var value = 1*node.value;
		for (var k=0;k<obj.length;k++) {
			var node2_name = obj[k];
			var n = router.node(node2_name);

			if (n.value !== null) {
				value *= 1*n.value;
			}
		}
		router.node(this.id).publish(node.time, value);
	};
};

