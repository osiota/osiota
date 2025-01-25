const http = require("http");
const fs = require("fs/promises");

const configuration_files = {};

exports.init = async function(node, app_config, main, host_info) {
	if (typeof app_config.file !== "string") {
		console.warn("config-include: No filename given.");
		return;
	}
	if (app_config.once && typeof configuration_files[app_config.file]
			!== "undefined") {
		console.log("config-include: Configuration file already "+
				"loaded.");
		return;
	}
	configuration_files[app_config.file] = this;

	if (typeof app_config.writeable !== "boolean") {
		app_config.writeable = false;
	}

	var config = {};
	var sub_apps = [];
	try {
		var content = await fs.readFile(app_config.file);
		config = JSON.parse(content);
		config = main.config_cleaning(config);
		sub_apps = main.sub_config(config, this._source);
	} catch (e) {
		if (!app_config.ignore_missing)
			console.warn("Include Config, Exception", e.stack || e);
	}

	var cleaning_object = [];
	if (app_config.writeable && app_config.file.match(/\.json$/i)) {
		var cb_config_save = async function() {
			var _this = this;
			try {
				await fs.writeFile(app_config.file,
					JSON.stringify(config, null, '\t'));
			} catch (err) {
				console.error("Error writing file:", err);
			}
		};
		main.on("config_save", cb_config_save);
		cleaning_object.push(() => {
			main.removeListener("config_save", cb_config_save);
		});
	}

	cleaning_object.push(() => {
		configuration_files[app_config.file] = undefined;
	});

	cleaning_object.push(await sub_apps);

	// undo sub_config
	return cleaning_object;
};
