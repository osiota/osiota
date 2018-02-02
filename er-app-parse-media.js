exports.inherit = ["parse-text"];

exports.parser = function(node, callback) {
	console.log("MEDIA PARSER");

	var content = node.value;
	var metadata = JSON.parse(JSON.stringify(node.metadata));

	var b = new Buffer(content, "utf8").toString('base64');

	/* calc mimetype */
	var mimetype = "application/base64";
	var m = metadata.file_ext.match(/(jpeg|jpg|png|gif)/);
	if (m) {
		mimetype = "image/"+m[1];
	}
	if (metadata.file_ext.match(/mjpe?g/)) {
		mimetype = "video/x-motion-jpeg";
	}
	metadata.mimetype = mimetype;
	metadata.type = mimetype.replace(/[\/].*$/, "")+".info";

	var data = [{
		time: node.time,
		value: 'data:'+mimetype+';base64,'+b
	}];
	callback(metadata, data);
};

