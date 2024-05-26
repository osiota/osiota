
exports.create_promise_callback = function() {
	var fn_resolve = null;
	var fn_reject = null;
	var p = new Promise((resolve, reject) => {
		fn_resolve = resolve;
		fn_reject = reject;
	});
	var reply = function(error, value) {
		if (error) return fn_reject(error);
		return fn_resolve(value);
	};

	return [reply, p];
}
