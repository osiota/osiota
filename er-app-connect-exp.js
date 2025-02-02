
exports.inherit = [ "connect" ];

/*
 * source is a boolean value
 */

// map from source to target
exports.map_value = function(x, metadata, nmetadata) {
	let limits = metadata.values;
	let nlimits = nmetadata.values;
	const exp = this._config.exp || 1.2;

	if (!Array.isArray(limits) || limits.length < 2)
		limits = [0, 255];
	if (!Array.isArray(nlimits) || nlimits.length < 2)
		nlimits = [0, 255];
	const a = nlimits[1];
	const b = nlimits[0];
	const c = limits[1];
	const d = limits[0];

	// f = (a-b) * ( (x-d)/(c-d) )^exp + b
	return (a-b)*Math.pow((x-d)/(c-d),exp) + b;
};
// map from target to source
exports.re_map_value = function(value, metadata, nmetadata) {
	let limits = metadata.values;
	let nlimits = nmetadata.values;
	const exp = this._config.exp || 1.2;

	if (!Array.isArray(limits) || limits.length < 2)
		limits = [0, 255];
	if (!Array.isArray(nlimits) || nlimits.length < 2)
		nlimits = [0, 255];
	const a = nlimits[1];
	const b = nlimits[0];
	const c = limits[1];
	const d = limits[0];

	// f = (a-b) * ( (x-d)/(c-d) )^(1/exp) + b
	return (a-b)*Math.pow((x-d)/(c-d),1/exp) + b;
};

