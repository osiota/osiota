var execFile = require('child_process').execFile;

var install_app = function(app, app_config, callback) {
	app = app.replace(/^er-app-/, "").replace(/\/.*$/, "");

	console.log("install app (npm):", app);
	var url = "git+ssh://git@gitlab.ibr.cs.tu-bs.de/eneff-campus-2020/er-app-" + app + ".git";
	//var url = "git+https://gitlab.ibr.cs.tu-bs.de/eneff-campus-2020/er-app-" + app + ".git";
	execFile("npm", ["install", url], callback);
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
		main.on("app_loading_error", function(e, node, app, l_app_config, host_info, auto_install, callback) {
			if (try_to_install.hasOwnProperty("app"))
				return;
			try_to_install[app] = true;
			if (e.hasOwnProperty("code") && e.code === "ER_APP_NOT_FOUND") {
				install_app(app, app_config, function(err) {
					if (err) throw err;
					main.startup(node, app, l_app_config,
						host_info, auto_install, callback);
				});
			} else {
				console.error("error starting app:",
						e.stack || e);
			}
		});
	}
};

/*
main.prototype.get_allapps = function(callback) {
	npm.command("ls", [], true, function(data, lite) {
		var library_names = [];
		var regexp = new RegExp("^er-app-");
		Object.keys(lite.dependencies).sort().forEach(function(name) {
			if(name.match(regexp)) {
				library_names.push(name);
			}
		});
		callback(library_names);
	});
};
*/

