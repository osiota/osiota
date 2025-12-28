
exports.inherit = ["test-not-found/abc"];

exports.init = function(node, app_config, main) {
	console.log(this._application_interface.app_id, "app loaded.", this.date);
};
