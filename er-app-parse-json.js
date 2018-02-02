exports.inherit = ["parse-text"];

exports.parser = function(node, callback) {
	var time = node.time;
	var content = node.value;
	var metadata = JSON.parse(JSON.stringify(node.metadata));

	metadata.type = "unknown.data";
	if (typeof metadata.file_ext === "string") {
		metadata.type = metadata.file_ext.replace(/json/, "object");
	}

	var object = JSON.parse(content.toString());

	var data = [{time: time, value: object}];

	if (typeof object === "object") {
		if (typeof object.metadata === "object") {
			metadata = object.metadata;
		} else if (typeof object.type === "string") {
			metadata.type = object.type;
		}
		
		if (object.hasOwnProperty("data")) {
			data = object.data;
		} else if (object.hasOwnProperty("value")) {
			if (object.hasOwnProperty("time")) {
				time = object.time;
			}
			data = [{
				time: time,
				value: object.value
			}];
		}
	}

	callback(metadata, data);
};

