const fs = require("fs");
const execFile = require('child_process').execFile;
const util = require('util');

const execFilePromise = util.promisify(execFile);

exports.inherit = ['install-apps-git'];

exports.install_app = async function(app, app_config) {
	console.info("install app (npm):", app);

	let npm_path = "osiota-app-";
	if (typeof app_config.npm_path === "string") {
		npm_path = app_config.npm_path;
	}
	const target_dir = "node_modules/osiota-app-" + app;
	if (await this.fileExists(target_dir)) {
		return true;
	}

	let url = npm_path + app;
	if (npm_path.match(/^git/)) {
		// e.g. for "git+https://github.com/osiota/osiota-app-"
		url += ".git";
	}
	try {
		await execFilePromise("npm", ["install", "--omit=dev", "--omit=optional", "--omit=peer", url]);
	} catch (err) {
		console.error("Error installing app (npm)", err);
		return false;
	}
	return true;
};

exports.cli = async function(argv, show_help, main) {
	if (show_help) {
		console.info('App Options\n' +
			'  --npm_path     Prefix for the npm package\n' +
			'                 (default: "osiota-app-")\n' +
			'  [apps ...]     Apps to install\n');
		return;
	}
	for (const a of argv._) {
		await this.install_app(this.clean_repo_name(a), argv);
	}
};
