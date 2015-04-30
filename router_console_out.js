
exports.init = function(router, basename) {
	router.dests.console = function(id, time, value) {
		console.log(id + " [" + time + "]:\t" + value);
	};
}

