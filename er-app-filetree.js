
const fs = require("fs");
const readdirp = require("readdirp");
//const Buffer = require("buffer");

/*
var dataurl_base64 = function(mimetype) {
	return function(content, metadata, callback) {
		var b = new Buffer(content, "utf8").toString('base64');

		if (typeof metadata.type !== "string")
			metadata.type = mimetype.replace(/[\/].*$/, "")+".info";

		var data = [{
			time: metadata.file_mtime,
			'data:'+mimetype+';base64,'+b;
		}];
		callback(metadata, data);
	};	
};

var parser = {};
parser.txt = function(content, metadata, callback) {
	if (typeof metadata.type !== "string")
		metadata.type = "text.info";

	var time = metadata.file_mtime;
	var data = [{time: time, value: content.toString()}];

	callback(metadata, data);
};
parser.html = function(content, metadata, callback) {
	if (typeof metadata.type !== "string")
		metadata.type = "html.info";

	var time = metadata.file_mtime;
	var data = [{time: time, value: content.toString()}];

	callback(metadata, data);
};
parser.jpeg = dataurl_base64("image/jpeg");
parser.jpg = parser.jpeg;
parser.png = dataurl_base64("image/png");
parser.gif = dataurl_base64("image/gif");
parser.mjpeg = dataurl_base64("video/x-motion-jpeg");
parser.data = function(content, metadata) {
	if (typeof metadata.type !== "string")
		metadata.type = "unknown.data";

	var time = metadata.file_mtime;
	var data = [{time: time, value: content.toString()*1}];

	callback(metadata, data);
};
parser.json = function(content, metadata) {
	if (typeof metadata.type !== "string" &&
			typeof metadata.file_ext === "string") {
		if (metadata.file_ext == "json")
			metadata.type = "object";
		else
			metadata.type = meta.file_ext.replace(/json/, "object");
	}

	var object = JSON.parse(content.toString());
	if (typeof object === "object") {
		if (typeof object.metadata === "object") {
			metadata = object.metadata;
		} else if (typeof object.type === "string") {
			metadata.type = object.type;
		} else if (object.hasOwnProperty("data")) {
			data = object.data;
		}

		if (object.hasOwnProperty("value") &&
				object.hasOwnProperty("time")) {
			data = [{
				time: object.time,
				value: object.value
			}];
		}
	}
	return object;
};
*/

exports.config_readfile_fileobject = function(node, file) {
	var path = file.path;
	var fullpath = file.fullPath;
	var mtime = file.stat.mtime / 1000;
	return this.config_readfile(node, fullpath, path, mtime);
};

exports.config_readfile = function(node, fullpath, path, mtime) {
	var matches = path.match(/\.([^\/]*)$/i);
	if (!matches)
		return;
	var file_ext = matches[1].toLowerCase();

	var metadata = {
		"type": "contents.file",
		"file_ext": file_ext,
		"file_name": path
	};

	path = path
		.replace(/\/@/, "@")
		.replace(/\.[^\/]*$/, "");

	var n = node.node(path, metadata);
	if (n) {
		fs.readFile(fullpath, function(err, content) {
			if (err) throw err;
			n.publish(mtime, content);
		});
	}
};

exports.map_elements = function(main, sub_app_config, metadata) {
	var app = main.application_manager.find_app([{
		"app_type": "parser",
		"file_ext": metadata.file_ext,
		"file_name": metadata.file_name
	}, metadata]);
	if (app === null) app = false;

	sub_app_config.self_app = app;
};

exports.init = function(node, app_config, main) {
	var _this = this;

	if (typeof app_config.dir !== "string") {
		throw new Error("config option dir not defined.");
	}

	var map = node.map(app_config.map_config, null,
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
	}, function(err, files) {
		if (err) throw err;

		files.files.forEach(function(file) {
			_this.config_readfile_fileobject(map, file);
		});
	});

	return [map];
};
