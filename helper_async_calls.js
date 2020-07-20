
exports.async_calls = function(functions, callback) {
	var items = functions.length;
	var results = [];
	functions.forEach(function(f, i) {
		f(function(err, result) {
			if (err) {
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
