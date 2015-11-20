
/* A module to substract a bias value */
exports.init = function(router, basename) {
	
	var mindata = {};
	router.dests.bias = function(node, relative_name) {
		if (relative_name !== "") return;

		var value = node.value;
		if (typeof value !== "number") {
			return;
		}
		if (!mindata.hasOwnProperty(this.id)) {
			if (value < 0.1) return;

			mindata[this.id] = {"value": value };
		}
		var v = 0;
		if (mindata[this.id].value > value && value > 0.1) {
			v = 0;
			mindata[this.id].value = value;
		} else {
			v = value - mindata[this.id].value;
		}
		router.publish(this.id, node.time, v);
	};

};
