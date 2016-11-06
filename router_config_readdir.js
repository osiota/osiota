
var fs = require("fs");
var readdirp = require("readdirp");
//var Buffer = require("buffer");

var dataurl_base64 = function(mimetype) {
	return function(content, meta) {
		var b = new Buffer(content, "utf8").toString('base64');
		//var b = Buffer.from(content, "utf8").toString('base64');
		meta.type = mimetype.replace(/[\/].*$/, "") + ".info";
		return 'data:'+mimetype+';base64,'+b;
	};	
};

/* content converter */
var cc = {};
cc.txt = function(content, meta) {
	meta.type = "text.info";
	return content.toString();
};
cc.html = function(content, meta) {
	meta.type = "html.info";
	return content.toString();
};
cc.jpeg = dataurl_base64("image/jpeg");
cc.jpg = cc.jpeg;
cc.png = dataurl_base64("image/png");
cc.gif = dataurl_base64("image/gif");
cc.mjpeg = dataurl_base64("video/x-motion-jpeg");
cc.data = function(content, meta) {
	return content.toString() * 1;
};
cc.json = function(content, meta) {
	if (meta.type == "json")
		meta.type = "object";
	else
		meta.type = meta.type.replace(/json/, "object");
	var object = JSON.parse(content.toString());
	if (object.hasOwnProperty("type"))
		meta.type = object.type;
	if (object.hasOwnProperty("time"))
		meta.time = object.time;
	if (object.hasOwnProperty("value"))
		return object.value;
	return object;
};

exports.config_readfile_fileobject = function(basenode, file) {
	var path = file.path;
	var fullpath = file.fullPath;
	var time = file.stat.mtime / 1000;
	return exports.config_readfile(basenode, fullpath, path, time);
};

exports.config_readfile = function(basenode, fullpath, path, time) {
	fs.readFile(fullpath, function(err, content) {
		if (err) throw err;
		var matches = path.match(/\.(.*)$/i);
		var meta = {};
		meta.time = time;
		meta.type = "";
		if (matches) {
			var type = matches[1].toLowerCase();
			meta.type = type;
			if (cc.hasOwnProperty(type)) {
				content = cc[type](content, meta);
			} else if (type.match(/program\.data$/)) {
				content = cc["txt"](content, meta);
			} else if (type.match(/\.data$/)) {
				content = cc["data"](content, meta);
			} else if (type.match(/json/)) {
				content = cc["json"](content, meta);
			} else {
				content = null;
			}
		} else {
			content = null;
		}
		path = path.replace(/\/@/, "@");
		path = path.replace(/\.[^\/]*$/, "");
		if (meta.type != "")
			path = path + "." + meta.type;
		basenode.node(path).publish(meta.time, content);
	});

};

exports.init = function(router, basename, structure_dir) {
	var basenode = router.node(basename);

	readdirp({
		root: structure_dir,
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
			exports.config_readfile_fileobject(basenode, file);
		});
	});

};
