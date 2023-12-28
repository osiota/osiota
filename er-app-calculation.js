/**
 * Application: Perform Calculation
 */

exports.metadata_type = "link.rpc";

exports.calculation = function(e) {
	return e;
};

exports.node_set = function(node, value, time, app_config) {
	value = this.calculation(value, time, app_config);
	if (typeof value === "undefined") return;
	return node.publish(time, value);
};

exports.init = function(node, app_config, main, host_info) {
	var _this = this;

	node.announce([{
		"type": this.metadata_type
	}, app_config.metadata]);

	return _this._source.subscribe(function(
			do_not_add_to_history, initial){
		if (initial) return;
		_this.node_set(node, this.value, this.time,
				app_config);
	});

	return [sr, node];
};
