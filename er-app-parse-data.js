exports.inherit = ["parse-text"];

exports.parser = function(node, callback) {
	var time = node.time;
	var content = node.value;
	var metadata = JSON.parse(JSON.stringify(node.metadata));

	metadata.type = "unknown.data";

	var data = [{
		time: time,
		value: content.toString()*1,
		do_not_add_to_history: true
	}];

	callback(metadata, data);
};
