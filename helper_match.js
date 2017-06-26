
exports.match = function(object, probe) {
	if (typeof object !== typeof probe)
		return false;
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
