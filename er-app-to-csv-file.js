/* Save data in a csv file */

// use graceful-fs to protect against EMFILE errors when opening to many files.
//const fs = require('fs');
const fs = require('graceful-fs');

function module_appendFile(filename, content) {
	fs.appendFile(filename, content, function(err) {
		if (err) {
			throw err;
		}
		// data appended successfully
	});
};

exports.init = function(node, app_config, main, host_info) {

	let prefix = "./data/";
	if (typeof app_config.prefix === "string") {
		prefix = app_config.prefix;
	}
	let filename = this._source.name.replace(/\//g, "_");
	if (typeof app_config.filename === "string") {
		filename = app_config.filename;
	}

	filename = prefix + filename + ".csv";

	return this._source.subscribe(function() {
		if (this.time === null) return;

		if (this.value === null) return; //value = "null";

		const content = this.time + "\t" + this.value + "\n";
		module_appendFile(filename, content);
	});
};
