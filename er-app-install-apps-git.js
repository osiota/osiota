var execFile = require('child_process').execFile;

var install_app = function(app, app_config, callback) {
	var install_dir = "../";
	if (typeof app_config.install_dir === "string" &&
			app_config.install_dir !== "") {
		install_dir = app_config.install_dir.replace(/\/$/, "") + "/";
	}
	app = app.replace(/^er-app-/, "");
	execFile("git", ["clone", "git@gitlab.ibr.cs.tu-bs.de:eneff-campus-2020/er-app-" + app + ".git", install_dir + "er-app-" + app], function(err) {
		if (err) {
			callback(err);
			return;
		}
		execFile("npm", ["install"], {
			"cwd": install_dir + "er-app-" + app
		}, callback);
	});
};

exports.init = function(node, app_config, main, host_info) {
	node.announce({
		"type": "installapps.admin"
	});
	node.rpc_install_app = function(reply, app) {
		install_app(app, app_config, function(err) {
			if (err) {
				reply("Error installing app", err);
			}

			// todo: check error.
			reply(null, "okay");
		});
	};

	if (typeof app_config.auto_install_missing_apps === "boolean" &&
			app_config.auto_install_missing_apps) {
		main.removeAllListeners("app_loading_error");
		var running = false;
		main.on("app_loading_error", function(e, node, app, l_app_config, host_info, auto_install, callback) {
			if (running) return;
			running = true;
			if (e.hasOwnProperty("code") && e.code === "ER_APP_NOT_FOUND") {
				install_app(app, app_config, function(err, stdout) {
					if (err) throw err;
					main.startup(node, app, l_app_config,
						host_info, auto_install, callback);
					running = false;
				});
			} else {
				console.error("error starting app:", e.stack || e);
			}
		});
	}
};

