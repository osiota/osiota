
exports.async_calls = function(functions, callback) {
	let items = functions.length;
	const results = [];
	functions.forEach(function(f, i) {
		f(function(err, result) {
			if (err) {
				if (items <= 0) return;
				items = 0;
				return callback(err);
			}
			results[i] = result;
			if (--items === 0) {
				callback(null, results);
			}
		});
	});
};
