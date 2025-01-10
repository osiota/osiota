const fs = require("fs");
const execFile = require('child_process').execFile;
const util = require('util');

const execFilePromise = util.promisify(execFile);

exports.clean_repo_name = function(app_name) {
	return app_name
		.replace(/^(?:(?:er|osiota)-app-)?((?:@[^\/]+\/)?[^\/]+)\/.*?$/, '$1');
}

exports.fileExists = async function(targetname) {
	try {
		await fs.promises.access(targetname, fs.constants.F_OK);
		return true;
	} catch (err) {
		if (err.code !== "ENOENT") {
			throw err;
		}
		return false;
	}
}

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
		if (await this.fileExists(target_dir)) {
			console.log("App already installed:", target_dir);
			return true;
		}
		await execFilePromise("git", ["clone", repo_path + app + ".git", target_dir]);
	} catch (err) {
		if (err.code === 128 && err.stderr && err.stderr.match(/not found/)) {
			const msg = err.stderr.replace(/^Cloning into .*\n|^fatal: repository .* not found$/g, "").replace(/\r?\n/g, " ");
			console.error("Error installing app (git): Repo does not exist.", msg)
			return false;
		}
		console.error("Error installing app (git)", err);
		return false;
	}
	try {
		if (await this.fileExists(target_dir + "/package.json")) {
			console.info("run npm install:", app);
			await execFilePromise("npm", ["install", "--omit=dev"], {"cwd": target_dir});
		}
	} catch(err) {
		console.error("Error installing npm packages of app (git)", err);
		return false;
	}
	return true;
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
		await this.install_app(this.clean_repo_name(a), argv);
	}
};

// global, as well for inheriting apps:
exports.try_to_install = {};

exports.init = function(node, app_config, main, host_info) {
	const _this = this;
	node.announce({
		"type": "installapps.admin"
	});
	node.rpc_install_app = async function(app_name) {
		const app = _this.clean_repo_name(app_name);
		exports.try_to_install[app] = _this.install_app(app, app_config);
		return await exports.try_to_install[app];
	};
	if (Array.isArray(app_config.install_apps)) {
		for (const app of app_config.install_apps) {
			if (!exports.try_to_install.hasOwnProperty(app)) {
				exports.try_to_install[app] = this.install_app(app, app_config);
			} else {
				console.warn("App", app, "already installing.");
			}
		}
	}

	if (app_config.auto_install_missing_apps) {
		main.removeAllListeners("app_loading_error");
		const cb_app_loading_error = async function(e, node, app_name, local_app_config,
				auto_install, callback) {
			if (!e.hasOwnProperty("code") ||
					e.code !== "OSIOTA_APP_NOT_FOUND") {
				console.error("error loading app:", e);
				return;
			}
			if (auto_install === false) {
				// just show error:
				console.error("error loading app:", e);
				return;
			}

			const app = _this.clean_repo_name(app_name);

			if (!exports.try_to_install.hasOwnProperty(app)) {
				exports.try_to_install[app] = _this.install_app(app, app_config);
			}
			if (await exports.try_to_install[app]) {
				main.application_loader.startup(node, app_name, local_app_config,
					/* auto_install */ false,
					callback);
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

