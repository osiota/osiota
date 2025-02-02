
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
