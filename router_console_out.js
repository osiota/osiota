
exports.init = function(router, basename) {
	router.dests.console = function(id, name, time, value) {
		console.log(id + ": " + name + " [" + time + "]:\t" + value);
	};
}

