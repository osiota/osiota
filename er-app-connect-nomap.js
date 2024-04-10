
exports.inherit = [ "connect" ];

/*
 * source is a boolean value
 */

// map from source to target
exports.map_value = function(value, source_metadata, target_metadata) {
	console.info("MAP VALUE", value);
	return value;
};

// map from target to source
exports.re_map_value = function(value, target_metadata, source_metadata) {
	console.info("RE MAP VALUE", value);
	return value;
};

