var fs = require("fs");

// helper:
exports.read = function(config_file) {
	if (!config_file) {
		return {};
	}
	try {
		return JSON.parse(fs.readFileSync(config_file));
	} catch (err) {
		// Show JSON parsing errors:
		if (err.code !== "ENOENT") {
			return console.error(err);
		}
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
