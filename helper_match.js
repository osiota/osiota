
const isRegExp = function(object) {
	return Object.prototype.toString.call(object) === '[object RegExp]';
}

exports.match = function(object, probe) {
	if (typeof object !== typeof probe)
		return false;
	for (const key in probe) {
		if (probe.hasOwnProperty(key)) {
			if (!object.hasOwnProperty(key))
				return false;
			if (isRegExp(probe[key])) {
				if (!(""+object[key])
						.match(probe[key])) {
					return false;
				}
			}
			else if (object[key] != probe[key]) {
				return false;
			}
		}
	}
	return true;
};
