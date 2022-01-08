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
	if (typeof this._load_delay === "number") {
		delay = this._load_delay;
	}
	if (typeof app_config.load_delay === "number") {
		delay = app_config.load_delay;
	}

	var co = [];
	if (typeof this.init_preload === "function") {
		co[0] = this.init_preload(node, app_config, main, host_info);
	}

	var tid = setTimeout(function() {
		co[1] = _this.init_delayed(node, app_config, main, host_info);
	}, delay * 1000);

	return [tid, co];
};
