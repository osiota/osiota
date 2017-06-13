var http = require("http");

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
		config = require(app_config.file);
		config = main.config_cleaning(config);
		main.sub_config(config);
	} catch (e) {
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
