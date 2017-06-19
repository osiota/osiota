
exports.match = function(object, probe) {
	for (var key in probe) {
		if (probe.hasOwnProperty(key)) {
			if (!object.hasOwnProperty(key) ||
					object[key] != probe[key]) {
				return false;
			}
		}
	}
	return true;
};
