
exports.init = function(node, app_config, main, host_info) {
	var basename = app_config.basename;

	node(basename).subscribe(function() {
		console.log(basename + " [" + this.time + "]:\t" + this.value);

	});
};

