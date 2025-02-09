
exports.init = function(node, app_config, main) {
	const eventemitter = this._application_interface.eventemitter;
	this.date = new Date();
	console.log(this._application_interface.app_id, "app loaded.", this.date);
	if (eventemitter) eventemitter.emit("init");
};
exports.unload = function() {
	const eventemitter = this._application_interface.eventemitter;
	console.log(this._application_interface.app_id, "app unloaded.", this.date);
	if (eventemitter) eventemitter.emit("unload");
}
