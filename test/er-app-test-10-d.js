
exports.init = function(node, app_config, main) {
	this.date = new Date();
	console.log(this._id, "app loaded.", this.date);

	var counter = 1;
	var t = setInterval(function() {
		console.log("ping", counter++);
	}, 10);

	return [t, ()=>{
		console.log(this._id, "app unloaded via obj.", this.date);
	}];
};

