var http = require("http");
var fs = require("fs");

exports.init = function(node, app_config, main, host_info) {
	if (typeof app_config.file !== "string") {
		console.warn("config-include: No filename given.");
		return;
	}
	if (typeof app_config.writeable !== "boolean") {
		app_config.writeable = false;
	}

	var config = {};
	try {
		var content = fs.readFileSync(app_config.file);
		config = JSON.parse(content);
		config = main.config_cleaning(config);
		main.sub_config(config, this._source);
	} catch (e) {
		if (!app_config.ignore_missing)
			console.warn("Include Config, Exception", e.stack || e);
	}

	if (app_config.writeable && app_config.file.match(/\.json$/i)) {
		var cb_config_save = function() {
			var _this = this;
			fs.writeFile(app_config.file,
					JSON.stringify(config, null, '\t'),
					function(err) {
				if (err) {
					throw err;
				}
			});
		};
		main.on("config_save", cb_config_save);
		return [function() {
			main.removeListener("config_save", cb_config_save);
		}];
	}

	// todo: return undo sub_config
};
