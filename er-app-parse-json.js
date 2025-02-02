exports.inherit = ["parse-text"];

exports.parser = function(node, callback) {
	const time = node.time;
	const content = node.value;
	const metadata = JSON.parse(JSON.stringify(node.metadata));

	metadata.type = "unknown.data";
	if (typeof metadata.file_ext === "string") {
		metadata.type = metadata.file_ext.replace(/json/, "object");
	}

	const object = JSON.parse(content.toString());

	const data = [{
		time: time,
		value: object,
		do_not_add_to_history: true
	}];

	if (typeof object === "object") {
		if (typeof object.metadata === "object") {
			metadata = object.metadata;
		} else if (typeof object.type === "string") {
			metadata.type = object.type;
		}

		if (object.hasOwnProperty("data")) {
			data = object.data;
			// do_not_add_to_history: false
		} else if (object.hasOwnProperty("value")) {
			if (object.hasOwnProperty("time")) {
				time = object.time;
			}
			data = [{
				time: time,
				value: object.value,
				do_not_add_to_history: true
			}];
		}
	}

	callback(metadata, data);
};

