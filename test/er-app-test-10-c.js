
exports.init = function(node, app_config, main, host_info) {
	this.date = new Date();
	console.info(this._id, "app loaded.", this.date);

	var t = setTimeout(function() {
		throw new Error("Module was not unloaded.");
	}, 1000);

	return [t, ()=>{
		console.info(this._id, "app unloaded via obj.", this.date);
	}];
};

