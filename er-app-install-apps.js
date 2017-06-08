
var npm = require('npm');
if (npm) {
	npm.command = function(command) {
		var args = Array.prototype.slice.call(arguments);
		// var command =
		args.shift();
		var callback = args.pop();

		this.load(function(err, npm) {
			if (err) throw new Error("npm load error: " + JSON.stringify(err));
			if (!this.commands.hasOwnProperty(command))
				throw new Error("npm command not found");

			console.log("run: npm ", command, args);

			args.push(function(err, data, lite) {
				if (err) throw new Error("npm error: " + JSON.stringify(err));
				if (typeof callback === "function") {
					callback(data, lite);
				}
			});

			this.commands[command].apply(this.commands, args);
		});
	}
};

var install_app = function(app, callback) {
	app = app.replace(/^er-app-/, "");
	npm.command("install", ["git+https://gitlab.ibr.cs.tu-bs.de/eneff-campus-2020/er-app-" + app + ".git"], callback);
};

exports.init = function(node, app_config, main, host_info) {
	node.announce({
		"type": "installapps.admin"
	});
	node.rpc_install_app = function(reply, app) {
		install_app(app, function() {
			// todo: check error.
			reply(null, "okay");
		});
	};

	if (typeof app_config.auto_install_missing_apps === "boolean" &&
			app_config.auto_install_missing_apps) {
		main.removeAllListeners("app_loading_error");
		main.on("app_loading_error", function(e, node, app, app_config, host_info, auto_install, callback) {
			if (e.hasOwnProperty("code") && e.code === "MODULE_NOT_FOUND") {
				install_app(app, function() {
					this.startup(node, app, app_config,
						host_info, auto_install, callback);
				});
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

