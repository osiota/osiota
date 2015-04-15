
exports.init = function(router, basename) {
	process.stdin.setEncoding('utf8');
	process.stdin.on('readable', function() {
		var chunk = process.stdin.read();
		if (chunk !== null) {
			var str = chunk.toString();
			var lines = str.split(/\r?\n/g);
			for (var i=0; i<lines.length; i++) {
				if (lines[i] != "") {
					var result = lines[i].match(/^([^\[]+)\s+\[([0-9.]+)\]:\s+([-0-9.]+|undefined)$/);
					if (result) {
						var name = result[1];
						var time = result[2];
						var value = result[3];
						if (value === "undefined") value = null;
						router.route(basename + name, time, value);
					}
				}
			}
		}
	});
};
