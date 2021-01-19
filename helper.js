
exports.merge_object = function(object) {
	var args = Array.prototype.slice.call(arguments, 1);
	args.forEach(function(o) {
		if (Array.isArray(o)) {
			exports.merge_object
				.bind(null, object)
				.apply(null, o);
			return;
		}
		if (typeof o !== "object" || o === null)
			return;
		for (var key in o) {
			if (o.hasOwnProperty(key)) {
				if (object.hasOwnProperty(key) &&
						typeof object[key] === "object"
								&&
						object[key] !== null &&
						typeof o[key] === "object" &&
						o[key] !== null) {
					exports.merge_object(
						object[key], o[key]
					);
				} else {
					object[key] = o[key];
				}
			}
		}
	});

	return object;
};

