
var fs = require("fs");
var readdirp = require("readdirp");
//var Buffer = require("buffer");

var dataurl_base64 = function(mimetype) {
	return function(content) {
		var b = new Buffer(content, "utf8").toString('base64');
		//var b = Buffer.from(content, "utf8").toString('base64');
		return 'data:'+mimetype+';base64,'+b;
	};	
};

/* content converter */
var cc = {};
cc.txt = function(content) {
	return content.toString();
};
cc.jpeg = dataurl_base64("image/jpeg");
cc.jpg = cc.jpeg;
cc.png = dataurl_base64("image/png");
cc.gif = dataurl_base64("image/gif");
cc.mjpeg = dataurl_base64("video/x-motion-jpeg");
cc.json = function(content) {
	return JSON.parse(content.toString());
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
				var matches = path.match(/\.(\w+)$/i);
				if (matches && cc.hasOwnProperty(matches[1].toLowerCase())) {

					content = cc[matches[1].toLowerCase()](content);
				} else {
					content = true;
				}
				path = path.replace(/\/@/, "@");
				path = path.replace(/\.\w+?$/, "");
				router.node(basename + "/" + path).publish(time, content);
			});
		});
	});

};
