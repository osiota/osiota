
const fs = require("fs");
const readdirp = require("readdirp");

exports.config_readfile_fileobject = function(node, file) {
	const path = file.path;
	const fullpath = file.fullPath;
	const mtime = file.stat.mtime / 1000;
	return this.config_readfile(node, fullpath, path, mtime);
};

exports.config_readfile = function(node, fullpath, path, mtime) {
	const matches = path.match(/\.([^\/]*)$/i);
	if (!matches)
		return;
	const file_ext = matches[1].toLowerCase();

	const metadata = {
		"type": "contents.file",
		"file_ext": file_ext,
		"file_name": path
	};

	path = path
		.replace(/\/@/, "@")
		.replace(/\.[^\/]*$/, "");

	const n = node.node(path, metadata);
	if (n) {
		fs.readFile(fullpath, function(err, content) {
			if (err) throw err;
			n.publish(mtime, content, undefined, true);
		});
	}
};

exports.map_elements = function(main, sub_app_config, metadata) {
	let app = main.application_manager.find_app([{
		"app_type": "parser",
		"file_ext": metadata.file_ext,
		"file_name": metadata.file_name
	}, metadata]);
	if (app === null) app = false;

	sub_app_config.self_app = app;
};

exports.init = function(node, app_config, main) {
	const _this = this;

	if (typeof app_config.dir !== "string") {
		throw new Error("config option dir not defined.");
	}

	const map = node.map(app_config.map_config, null,
		this.map_elements.bind(this, main));

	readdirp({
		root: app_config.dir,
		directoryFilter: function(f) {
			if (f.name.match(/^\./))
				return false;
			return true;
		},
		fileFilter: function(f) {
			if (f.name.match(/^\./))
				return false;
			return true;
		}
	}).on("data", function(file) {
		_this.config_readfile_fileobject(map, file);
	});

	return [map];
};
