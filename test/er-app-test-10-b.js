
exports.init = function(node, app_config, main) {
	this.date = new Date();
	console.log(this._id, "app loaded.", this.date);
	const eventemitter = this._application_interface.eventemitter;
	if (eventemitter) eventemitter.emit("init");
};
exports.unload = function() {
	console.log(this._id, "app unloaded.", this.date);
	const eventemitter = this._application_interface.eventemitter;
	if (eventemitter) eventemitter.emit("unload");
}
exports.reinit = function() {
	console.log(this._id, "app reinit.", this.date);
	const eventemitter = this._application_interface.eventemitter;
	if (eventemitter) eventemitter.emit("reinit");
}
