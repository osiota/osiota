var execFile = require('child_process').execFile;

var install_app = function(app, app_config, callback) {
	app = app.replace(/^er-app-/, "").replace(/\/.*$/, "");

	console.log("install app (npm):", app);
	var url = "git+ssh://git@gitlab.ibr.cs.tu-bs.de/eneff-campus-2020/er-app-" + app + ".git";
	//var url = "git+https://gitlab.ibr.cs.tu-bs.de/eneff-campus-2020/er-app-" + app + ".git";
	execFile("npm", ["install", url], callback);
};

exports.cli = function(argv, main) {
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
				reply("Error installing app (npm)", err);
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
			if (try_to_install.hasOwnProperty("app"))
				return;
			try_to_install[app] = true;
			if (e.hasOwnProperty("code") &&
					e.code === "ER_APP_NOT_FOUND") {
				install_app(app, app_config, function(err) {
					if (err) throw err;
					main.startup(node, app, l_app_config,
						host_info, auto_install,
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

