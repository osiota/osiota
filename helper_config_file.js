var fs = require("fs");

// helper:
exports.read = function(config_file) {
	if (!config_file) {
		return {};
	}
	try {
		var contents = fs.readFileSync(config_file);
		contents = contents.toString().replace(/^#.*\n/, "");
		return JSON.parse(contents);
	} catch (err) {
		// Show JSON parsing errors:
		if (err.code !== "ENOENT") {
			throw err;
		}
		console.warn("Warning: Config file not found.");
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
