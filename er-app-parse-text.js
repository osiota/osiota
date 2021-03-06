exports.parser = function(node, callback) {
	var time = node.time;
	var content = node.value;
	var metadata = JSON.parse(JSON.stringify(node.metadata));

	if (metadata.file_ext == "html") {
		metadata.type = "html.info";
	} else {
		metadata.type = "text.info";
	}

	var data = [{
		time: time,
		value: content.toString(),
		do_not_add_to_history: true
	}];

	callback(metadata, data);
};

exports.init = function(node, app_config, main) {
	var _this = this;

	var cleaning_object = [];

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
				// TODO: history === false
				if (node.metadata && (
					metadata.full_history ||
					(metadata.history === false &&
						data.length > 1)
				)) {
					node.purge_history();
				}
				node.announce(metadata, true);
				node.publish_all(data, function(tid) {
					cleaning_object[0] = tid;
				}, function() {
					console.log("data published:",
						node.name);
					// TODO
				});
			});
		});

		return [s, cleaning_object, node];
	});
	return [r];
};

