
exports.init = function(node, app_config, main, host_info) {
	this.date = new Date();
	console.log(this._id, "app loaded.", this.date);

	var counter = 1;
	var t = setInterval(function() {
		console.log("ping", counter++);
	}, 10);

	return [t, function() {
		console.log("unload");
	}];
};

