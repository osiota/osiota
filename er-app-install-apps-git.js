const fs = require("fs");
var execFile = require('child_process').execFile;

var install_app = function(app, app_config, callback) {
	app = app.replace(/^er-app-/, "").replace(/\/.*$/, "");
	console.log("install app (git):", app);
	var install_dir = "../";
	if (typeof app_config.install_dir === "string" &&
			app_config.install_dir !== "") {
		install_dir = app_config.install_dir.replace(/\/$/, "") + "/";
	}
	execFile("git", ["clone", "git@gitlab.nerdbox.de:energy-router/er-app-" + app + ".git", install_dir + "er-app-" + app], function(err) {
		if (err) {
			callback(err);
			return;
		}
		fs.access(install_dir + "er-app-"+app + "/package.json",
				(fs.constants || fs).R_OK, function(err) {
			// no package json file:
			if (err)
				return;

			console.log("run npm install:", app);
			execFile("npm", ["install", "--production"], {
				"cwd": install_dir + "er-app-" + app
			}, callback);
		});
	});
};
exports.cli = function(argv, show_help, main) {
	if (show_help) {
		console.info('App Options\n' +
			'  --install_dir  Installation path\n' +
			'                 (default: "./")\n' +
			'  [apps ...]     Apps to install\n');
		return;
	}
	argv._.forEach(function(a) {
		install_app(a, argv, function(err) {
			if (err) {
				console.error("Error installing app (git)",err);
			}
		});
	});
};

exports.init = function(node, app_config, main, host_info) {
	node.announce({
		"type": "installapps.admin"
	});
	node.rpc_install_app = function(reply, app) {
		install_app(app, app_config, function(err) {
			if (err) {
				reply("Error installing app (git)", err);
				return;
			}

			reply(null, "okay");
		});
	};

	if (typeof app_config.auto_install_missing_apps === "boolean" &&
			app_config.auto_install_missing_apps) {
		main.removeAllListeners("app_loading_error");
		var try_to_install = {};
		var cb_app_loading_error = function(e, node, app, l_app_config,
				host_info, auto_install, callback) {
			var l_app = app.replace(/^er-app-/, "")
					.replace(/\/.*$/, "");
			if (try_to_install.hasOwnProperty(l_app))
				return;
			try_to_install[l_app] = true;

			if (e.hasOwnProperty("code") &&
					e.code === "OSIOTA_APP_NOT_FOUND") {
				install_app(app, app_config,
						function(err, stdout) {
					if (err) throw err;
					main.application_loader.startup(node, app, l_app_config,
						host_info, auto_install,
						false,
						callback);
				});
			} else {
				console.error("error starting app:",
						e.stack || e);
			}
		};
		main.on("app_loading_error", cb_app_loading_error);
		return [node, function() {
			main.removeListener("app_loading_error",
					cb_app_loading_error);
		}];
	}

	return [node];
};

