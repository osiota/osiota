const fs = require("fs");

exports.parser = function(content, metadata, callback) {
	var data = JSON.parse(content);

	var metadata = {"type": "unknown.data"};
	if (typeof data === "object" && typeof data.data === "object") {
		metadata = data.metadata;
		data = data.data;
	}
	callback(metadata, data);
};

exports.init = function(node, app_config, main, host_info) {
	var _this = this;
	if (typeof app_config.filename !== "string") {
		throw new Error("config option filename not defined.");
	}

	var cleaning_object = [];
	
	fs.readFile(app_config.filename, function(err, content) {
		if (err) throw err;

		_this.parser(content, {}, function(metadata, data) {
			node.announce(metadata);
			node.publish_all(data, function(tid) {
				cleaning_object[0] = tid;
			}, function() {
				console.log("done");
			});
		});
	});

	return [cleaning_object, node];
}
