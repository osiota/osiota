exports.parser = function(node, callback) {
	var time = node.time;
	var content = node.value;
	var metadata = JSON.parse(JSON.stringify(node.metadata));

	if (metadata.file_ext == "html") {
		metadata.type = "html.info";
	} else {
		metadata.type = "text.info";
	}

	var data = [{time: time, value: content.toString()}];

	callback(metadata, data);
};

exports.init = function(node, app_config, main) {
	var _this = this;

	var r =this._source.ready("announce", function(method, initial, update){
		if (update) return;

		if (this.metadata.type !== "contents.file")
			return;

		var s = this.subscribe(function(do_not_add_to_history, initial){
			if (this.value === null)
				return;
			console.log("call parser", _this._id);
			_this.parser(this, function(metadata, data) {
				if (typeof app_config.metadata == "object") {
					metadata = app_config.metadata;
				}
				node.announce(metadata, true);
				node.publish_all(data);
			});
		});

		return [node, s];
	});
	return [r];
};

