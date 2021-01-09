const assert = require('assert').strict;

exports.inherit = ["load-on-started"];

var get = function(object, path) {
	if (typeof object !== "object" || object === null) {
		return "unexpected";	
	}
	var item = path.shift();
	if (!path.length) {
		return object[item];
	}
	return get(object[item], path);
};

exports.init_delayed = function(node, app_config, main) {
	if (typeof app_config.path !== "string") {
		throw new Error("Option 'path' not defined.");
	}
	var actual = get(this, app_config.path.split("."));
	console.info("CHECKING", app_config.path);
	assert.deepEqual(actual, app_config.expected, app_config.message ||
			"data was not as expected.");
};
