
exports.init = function(node, app_config, main) {
	this.date = new Date();
	console.log(this._id, "app loaded.", this.date);
	const eventemitter = this._application_interface.eventemitter;
	if (eventemitter) eventemitter.emit("init");

	var t = setTimeout(function() {
		throw new Error("Module was not unloaded.");
	}, 4000);

	return [t, ()=>{
		console.log(this._id, "app unloaded via obj.", this.date);
		const eventemitter = this._application_interface.eventemitter;
		if (eventemitter) eventemitter.emit("unload");
	}];
};

