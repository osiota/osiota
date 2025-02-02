exports.inherit = ["parse-text"];

exports.parser = function(node, callback) {
	const time = node.time;
	const content = node.value;
	const metadata = JSON.parse(JSON.stringify(node.metadata));

	metadata.type = "unknown.data";

	const data = [{
		time: time,
		value: content.toString()*1,
		do_not_add_to_history: true
	}];

	callback(metadata, data);
};
