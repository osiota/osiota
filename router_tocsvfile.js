/* Save data in a csv file */

var fs = require('fs');

var module_appendFile = function(filename, content) {
	fs.appendFile('SensorData.txt', content, function(err) {
		if (err) {
			throw err;
		}
		// data appended successfully
	});
};

exports.init = function(router, basename, nodefiles) {

	router.dests.tocsvfile = function(id, time, value, name, obj, relative_name) {
		if (typeof relative_name === "undefined") {
			relative_name = "";
		}

		var filename = id;
		if (relative_name != "") {
		       filename += "_"+relative_name.replace("/\//", "_");
		}
		filename += ".csv";

		var content = time + "\t" + value + "\n";
		module_appendfile(filename, content);
	};

	for (var node in nodefiles) {
		var filename = nodefiles[node];

		router.register(basename + node, 'tocsvfile', filename);
	}
};
