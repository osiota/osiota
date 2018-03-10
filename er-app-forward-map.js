
exports.inherit = [ "forward" ];

/*
 * source is a boolean value
 */

// map from source to target
exports.map_value = function(value, source_metadata, target_metadata) {
	if (value) {
		return target_metadata.map_value;
	}
	// if not set: return undefined
	return target_metadata.map_value_false;
};

// map from target to source
exports.re_map_value = function(value, target_metadata, source_metadata) {
	if (value == source_metadata.map_value) {
		return true;
	}
	return false;
};

