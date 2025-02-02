exports.inherit = ["parse-text"];

exports.parser = function(node, callback) {
	console.log("MEDIA PARSER");

	const content = node.value;
	const metadata = JSON.parse(JSON.stringify(node.metadata));

	const b = new Buffer(content, "utf8").toString('base64');

	/* calc mimetype */
	let mimetype = "application/base64";
	const m = metadata.file_ext.match(/(jpeg|jpg|png|gif)/);
	if (m) {
		mimetype = "image/"+m[1];
	}
	if (metadata.file_ext.match(/mjpe?g/)) {
		mimetype = "video/x-motion-jpeg";
	}
	metadata.mimetype = mimetype;
	metadata.type = mimetype.replace(/[\/].*$/, "")+".info";

	const data = [{
		time: node.time,
		value: 'data:'+mimetype+';base64,'+b,
		do_not_add_to_history: true
	}];

	callback(metadata, data);
};

