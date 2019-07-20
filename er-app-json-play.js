const fs = require("fs");

exports.init = function(node, app_config, main, host_info) {
	var _this = this;
	if (typeof app_config.filename !== "string") {
		throw new Error("config option filename not defined.");
	}
	var file_ext = "";
	var matches = app_config.filename.match(/\.([^\/]*)$/i);
	if (matches) {
		file_ext = matches[1].toLowerCase();
	}

	var metadata = {
		"type": "contents.file",
		"file_ext": file_ext,
		"file_name": app_config.filename
	};

	var parser_app;
	if (typeof app_config.parser_app === "string") {
		parser_app = app_config.parser_app;
	} else {
		parser_app = main.application_manager.find_app([{
			"app_type": "parser",
			"file_ext": file_ext,
			"file_name": app_config.filename
		}, metadata]);
	}

	if (parser_app === false &&
			typeof app_config.metadata === "object") {
		metadata = app_config.metadata;
	}

	var vn = node.virtualnode();
	vn.announce(metadata);
	var a = vn.app(parser_app, app_config.subconfig);
	
	fs.readFile(app_config.filename, function(err, content) {
		if (err) throw err;

		vn.publish(undefined, content);
	});

	return [vn, a];
}
