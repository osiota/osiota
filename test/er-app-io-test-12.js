
exports.init = function(node, app_config, main) {
	this.date = new Date();
	console.log(this._id, "app loaded.", this.date);
};
exports.unload = function() {
	console.log(this._id, "app unloaded.", this.date);
}
