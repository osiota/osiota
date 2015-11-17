
/* A module to substract a bias value */
exports.init = function(router, basename) {
	
	var mindata = {};
	router.dests.bias = function(id, time, value, name, obj) {
		if (typeof value !== "number") {
			return;
		}
		if (!mindata.hasOwnProperty(id)) {
			if (value < 0.1) return;

			mindata[id] = {"value": value };
		}
		if (mindata[id].value > value && value > 0.1) {
			v = 0;
			mindata[id].value = value;
		} else {
			v = value - mindata[id].value;
		}
		router.publish(id, time, v);
	};

};
