/*
 * Usage:
 * add
 * 	exports.inherit = ["load-on-started"];
 * and call your init function:
 * 	exports.init_delayed(...);
 */

exports.init = function(node, app_config, main, host_info) {
	var _this = this;

	var run_init = function() {
		var obj = _this.init_delayed(node, app_config, main, host_info);
		_this.object_delayed = obj;
	};

	if (main._started) {
		run_init();
		return;
	}
	main.once("started", run_init);

	return function() {
		main.removeListener("started", run_init);
	};
};
exports.unload = function(object, unload_object) {
	unload_object(object);
	unload_object(this.object_delayed);
};
