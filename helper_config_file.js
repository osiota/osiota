var fs = require("fs");

// helper:
exports.read = function(config_file) {
	var config = {};
	try {
		if (config_file) {
			config = JSON.parse(
				fs.readFileSync(config_file)
			);
		}
	} catch (err) {
		// Show JSON parsing errors:
		if (err.code !== "ENOENT") {
			return console.error(err);
		}
	}
	return config;
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
