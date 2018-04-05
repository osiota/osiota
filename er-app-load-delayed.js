/*
 * Usage:
 * add
 * 	exports.inherit = ["load-delayed"];
 * and call your init function:
 * 	exports.init_delayed(...);
 */

exports.init = function(node, app_config, main, host_info) {
	var _this = this;

	var delay = 1;
	if (typeof app_config.load_delay === "number") {
		delay = app_config.load_delay;
	}

	var tid = setTimeout(function() {
		var obj = _this.init_delayed(node, app_config, main, host_info);
		_this.object_delayed = obj;
	}, delay * 1000);

	return tid;
};
exports.unload = function(object, unload_object) {
	unload_object(object);
	unload_object(this.object_delayed);
};
