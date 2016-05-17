
var fs = require("fs");
var readdirp = require("readdirp");
//var Buffer = require("buffer");

var dataurl_base64 = function(mimetype) {
	return function(content, meta) {
		var b = new Buffer(content, "utf8").toString('base64');
		//var b = Buffer.from(content, "utf8").toString('base64');
		meta.type = "info." + mimetype.replace(/[\/].*$/, "");
		return 'data:'+mimetype+';base64,'+b;
	};	
};

/* content converter */
var cc = {};
cc.txt = function(content, meta) {
	meta.type = "info.text";
	return content.toString();
};
cc.html = function(content, meta) {
	meta.type = "info.html";
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


exports.init = function(router, basename, structure_dir) {
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
			var path = file.path;
			var time = file.stat.mtime / 1000;
			fs.readFile(file.fullPath, function(err, content) {
				if (err) throw err;
				var matches = path.match(/\.(.*)$/i);
				var meta = {};
				meta.time = time;
				if (matches) {
					var type = matches[1].toLowerCase();
					meta.type = type;
					if (cc.hasOwnProperty(type)) {
						content = cc[type](content, meta);
					} else if (type.match(/^data/)) {
						content = cc["data"](content, meta);
					} else if (type.match(/json/)) {
						content = cc["json"](content, meta);
					} else {
						content = true;
					}
				} else {
					content = true;
				}
				path = path.replace(/\/@/, "@");
				path = path.replace(/\.[^\/]*$/, "");
				router.node(basename + "/" + path).publish(meta.time, content);
			});
		});
	});

};
