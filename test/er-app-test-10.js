
exports.init = function(node, app_config, main) {
	this.date = new Date();
	console.log(this._id, "app loaded.", this.date);
	if (this.eventemitter) this.eventemitter.emit("init");
};
exports.unload = function() {
	console.log(this._id, "app unloaded.", this.date);
	if (this.eventemitter) this.eventemitter.emit("unload");
}
