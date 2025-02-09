
if (typeof Promise.withResolvers !== "function") {
	Promise.withResolvers = function() {
		let resolve, reject;
		const promise = new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		});
		return {
			promise,
			resolve,
			reject,
		};
	};
}

exports.create_promise_callback = function() {
	const { promise, resolve, reject } = Promise.withResolvers();
	const reply = function(error, value) {
		if (error) return reject(error);
		return resolve(value);
	};

	return [reply, promise];
}

/**
 * Ensure promise helper
 *
 * @returns {Promise}
 */
exports.ensure_promise = function(func, ...args) {
	const { promise, resolve, reject } = Promise.withResolvers();
	const return_value = func(...args, (err, value)=>{
		if (err) return reject(err);
		return resolve(value);
	});
	// if is promise
	if (typeof return_value.then === "function") {
		// handle returned promise:
		return return_value;
	} else {
		// handle promise from callback:
		return promise;
	}
}
