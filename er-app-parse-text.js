exports.parser = function(node, callback) {
	const time = node.time;
	const content = node.value;
	const metadata = JSON.parse(JSON.stringify(node.metadata));

	if (metadata.file_ext == "html") {
		metadata.type = "html.info";
	} else {
		metadata.type = "text.info";
	}

	const data = [{
		time: time,
		value: content.toString(),
		do_not_add_to_history: true
	}];

	callback(metadata, data);
};

exports.init = function(node, app_config, main) {
	const _this = this;

	const cleaning_object = [];

	const r =this._source.ready("announce", function(method, initial, update){
		if (update) return;

		if (this.metadata.type !== "contents.file")
			return;

		const s = this.subscribe(function(do_not_add_to_history, initial){
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

