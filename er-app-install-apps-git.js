const fs = require("fs");
const execFile = require('child_process').execFile;
const util = require('util');

const execFilePromise = util.promisify(execFile);

exports.install_app = async function(app, app_config) {
	console.info("install app (git):", app);
	let install_dir = "../";
	if (typeof app_config.install_dir === "string" &&
			app_config.install_dir !== "") {
		install_dir = app_config.install_dir.replace(/\/$/, "") + "/";
	}

	let repo_path = "https://github.com/osiota/osiota-app-";
	if (typeof app_config.repo_path === "string") {
		repo_path = app_config.repo_path;
	}
	const target_dir = install_dir + "osiota-app-" + app;
	try {
		await fs.promises.access(target_dir, fs.constants.F_OK);
		console.log("App already installed:", target_dir);
		return;
	} catch (err) {
	}
	try {
		await execFilePromise("git", ["clone", repo_path + app + ".git", target_dir]);
		await fs.promises.access(target_dir + "/package.json", fs.constants.R_OK);
		console.log("run npm install:", app);
		await execFilePromise("npm", ["install", "--production"], {"cwd": target_dir});
	} catch (err) {
		console.error("Error installing app (git)", err);
	}
};

exports.cli = async function(argv, show_help, main) {
	if (show_help) {
		console.info('App Options\n' +
			'  --install_dir  Installation path\n' +
			'                 (default: "../")\n' +
			'  --repo_path    Prefix for the repo path to clone\n' +
			'                 (default: "https://github.com/osiota/osiota-app-")\n' +
			'  [apps ...]     Apps to install\n');
		return;
	}
	for (const a of argv._) {
		await this.install_app(a, argv);
	}
};

// global, as well for inheriting apps:
exports.try_to_install = {};

exports.init = function(node, app_config, main, host_info) {
	const _this = this;
	node.announce({
		"type": "installapps.admin"
	});
	node.rpc_install_app = async function(app) {
		exports.try_to_install[app] = _this.install_app(app, app_config);
		return await exports.try_to_install[app];
	};
	if (Array.isArray(app_config.install_apps)) {
		for (const app of app_config.apps) {
			if (!exports.try_to_install.hasOwnProperty(app)) {
				exports.try_to_install[app] = this.install_app(app, app_config);
			} else {
				console.warn("App", app, "already installing.");
			}
		}
	}

	if (app_config.auto_install_missing_apps) {
		main.removeAllListeners("app_loading_error");
		var cb_app_loading_error = async function(e, node, app, l_app_config,
				host_info, auto_install, callback) {
			if (!e.hasOwnProperty("code") ||
					e.code !== "OSIOTA_APP_NOT_FOUND") {
				console.error("error starting app:", e.stack || e);
				return;
			}

			var l_app = app.replace(/^(er|osiota)-app-/, "")
					.replace(/\/.*$/, "");

			if (!exports.try_to_install.hasOwnProperty(l_app)) {
				exports.try_to_install[l_app] = _this.install_app(app, app_config);
			}
			await exports.try_to_install[l_app];
			main.application_loader.startup(node, app, l_app_config,
				host_info, auto_install,
				false,
				callback);
		};
		main.on("app_loading_error", cb_app_loading_error);
		return [node, function() {
			main.removeListener("app_loading_error",
					cb_app_loading_error);
		}];
	}

	return [node];
};

