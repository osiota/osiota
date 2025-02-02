const fs = require("fs");

// helper:
exports.read = function(config_file) {
	if (!config_file) {
		return {};
	}
	try {
		let contents = fs.readFileSync(config_file);
		contents = contents.toString().replace(/^#.*\n/, "");
		return JSON.parse(contents);
	} catch (err) {
		throw new Error('Error reading config file', { cause: err });
	}
	return {};
};
exports.write = function(config_file, config) {
	fs.writeFile(config_file,
			JSON.stringify(config, null, '\t')+"\n",
			function(err) {
		if (err) {
			throw err;
		}
	});
};
