
exports.async_calls = function(functions, callback) {
	var items = functions.length;
	var results = [];
	functions.forEach(function(f, i) {
		f(function(r) {
			results[i] = r;
			if (--items === 0) {
				callback(results);
			}
		});
	});
};
