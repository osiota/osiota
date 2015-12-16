/* Save data in a csv file */

var fs = require('fs');

var module_appendFile = function(filename, content) {
	fs.appendFile(filename, content, function(err) {
		if (err) {
			throw err;
		}
		// data appended successfully
	});
};

exports.init = function(router, basename, nodefiles) {

	router.dests.tocsvfile = function(node, relative_name) {
		if (node.time === null) return;
		if (typeof relative_name === "undefined") {
			relative_name = "";
		}

		var filename = this.id;
		if (relative_name != "") {
		       filename += relative_name.replace(/\//g, "_");
		}
		filename += ".csv";

		if (node.value === null) return; //value = "null";
		var content = node.time + "\t" + node.value + "\n";
		module_appendFile(filename, content);
	};

	for (var node in nodefiles) {
		var filename = nodefiles[node];

		router.register(basename + node, 'tocsvfile', filename);
	}
};