
exports.init = function(router, basename) {
	router.dests.function = function(id, time, value, name, obj) {
		if (typeof obj === "function") {
			obj(id, time, value);
		}
	};
}

