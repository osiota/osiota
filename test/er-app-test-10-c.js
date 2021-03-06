
exports.init = function(node, app_config, main, host_info) {
	this.date = new Date();
	console.log(this._id, "app loaded.", this.date);
	if (this.eventemitter) this.eventemitter.emit("init");

	var t = setTimeout(function() {
		throw new Error("Module was not unloaded.");
	}, 1000);

	return [t, ()=>{
		console.log(this._id, "app unloaded via obj.", this.date);
		if (this.eventemitter) this.eventemitter.emit("unload");
	}];
};

