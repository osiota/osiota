const fs = require("fs");
const { execFile } = require('child_process');
const util = require('util');

const execFilePromise = util.promisify(execFile);

exports.clean_repo_name = function(app_name) {
	return app_name
		.replace(/^(?:(?:er|osiota)-app-)?((?:@[^\/]+\/)?[^\/]+)\/.*?$/, '$1');
};

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
};

exports.update_app = async function(app_or_repo_dir, app_config) {
    console.info("update app (git):", app_or_repo_dir);
    let target_dir;
    if (app_or_repo_dir.match(/^\//)) {
        // if is repo dir:
        target_dir = app_or_repo_dir;
    } else {
        let install_dir = "../";
        if (typeof app_config.install_dir === "string" &&
                app_config.install_dir !== "") {
            install_dir = app_config.install_dir.replace(/\/$/, "") + "/";
        }
        target_dir = install_dir + "osiota-app-" + app_or_repo_dir;
    }

	try {
		if (!await this.fileExists(target_dir + "/.git")) {
            console.info("is not a git repo:", app_or_repo_dir);
			return false;
		}
		const result = await execFilePromise("git", ["pull"]);
        if (result.stdout.match(/Already up to date/)) {
            return false;
        }
        if (await this.fileExists(target_dir + "/package.json")) {
			console.info("run npm install:", app_or_repo_dir);
			await execFilePromise("npm", ["install", "--omit=dev"], {"cwd": target_dir});
		}
	} catch(err) {
		console.error("Error updating app (git)", err);
		return false;
	}
	return true;
};

exports.get_repo_dirs = async function() {
    const searched_apps = await this._main.application_manager.search_apps();
    const repo_dirs = new Set();
    for (const app_name in searched_apps) {
        const a = searched_apps[app_name];
        repo_dirs.add(a.dir_path);
    }
    return Array.from(repo_dirs);
};

exports.update_apps = async function(app_config) {
    /*
    const apps = {};
    for (const key in this._main.application_loader.apps) {
        const a = this._main.application_loader.apps[key];
        const app_name = this.clean_repo_name(a._app);
        if (!apps[app_name]) {
            apps[app_name] = [];
        }
        apps[app_name].push(a);
    }
    const app_names = Object.keys(apps);
    */

    const app_names = await this.get_repo_dirs();
    let restart = false;
    for (const app_name of app_names) {
        restart ||= await this.update_app(app_name, app_config);
    }
    if (restart) {
        this._main.restart();
    }
};

exports.cli = async function(argv, show_help, main) {
	if (show_help) {
		console.info('App Options\n' +
			'  --all          Update all git based apps\n' +
			'  [apps ...]     Apps to update\n');
		return;
	}
    if (argv.all) {
        await this.update_apps(argv);
    } else {
        for (const a of argv._) {
            await this.update_app(this.clean_repo_name(a), argv);
        }
    }
};

exports.init = function(node, app_config, main) {
	const _this = this;
	node.announce({
		"type": "update.installapps.admin"
	});
	node.rpc_update_apps = async function() {
        await _this.update_apps(app_config);
	};
    node.rpc_update_app = async function(app_name) {
        const clean_app_name = _this.clean_repo_name(app_name);
        await _this.update_app(clean_app_name, app_config);
    };
	return [node];
};
