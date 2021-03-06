
exports.init = function(node, app_config, main, host_info) {
	this.date = new Date();
	console.log(this._id, "app loaded.", this.date);
	if (this.eventemitter) this.eventemitter.emit("init");
};
exports.unload = function() {
	console.log(this._id, "app unloaded.", this.date);
	if (this.eventemitter) this.eventemitter.emit("unload");
}
exports.reinit = function() {
	console.log(this._id, "app reinit.", this.date);
	if (this.eventemitter) this.eventemitter.emit("reinit");
}
