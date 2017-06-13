
exports.init = function(node, app_config, main, host_info) {
	return node.subscribe(function() {
		console.log(this.name + " [" + this.time + "]:\t" + this.value);
	});
};

