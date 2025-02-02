
const isObject = function(o) {
	return typeof o === "object" && o !== null;
};

exports.update_app = function(app_object) {
	if (!isObject(app_object)) return;
	if (typeof app_object.name === "string") {
		app_object.name = app_object.name.replace(/^(er|osiota)-app-/, "");
	}

	const app_config = app_object.config;
	if (isObject(app_config)) {
		exports.update_apps(app_config.app);

		/* {
		 *    "pname": "My Node",
		 *    "source": "/my/source/node"
		 * }
		 */
		if (typeof app_config.pnode === "string" &&
				typeof app_config.source === "string" &&
				typeof app_config.node === "undefined") {
			app_config.node = app_config.pnode;
			delete app_config.pnode;
		}

		/* scene
		 * {
		 *   "source": ...,
		 *   "filter": ...,
		 * }
		 */
		if (app_object.name === "scene" &&
				typeof app_config.source === "string" &&
				typeof app_config.target === "undefined" &&
				typeof app_config.filter === "object" &&
				typeof app_config.target_filter === "undefined") {
			app_config.target = app_config.source;
			delete app_config.source;
			app_config.target_filter = app_config.filter;
			delete app_config.filter;
		}
	}
};
// config = [app_object, app_object]
// app_object = {"name": "", "config": app_config}
// app_config = {..., app: config}
exports.update_apps = function(config) {
	if (!Array.isArray(config)) {
		return;
	}
	config.forEach(function(a) {
		exports.update_app(a);
	});
};

const add_app = function(config, app) {
	if (!Array.isArray(config.app)) {
		config.app = [];
	}
	config.app.push(app);
};
const add_app_pre = function(config, app) {
	if (!Array.isArray(config.app)) {
		config.app = [];
	}
	config.app.unshift(app);
};

exports.update_config = function(config) {

	// add version tag
	//config.version = "osiota/osiota@2.0.0";
	// save_history ?
	// hostname ?
	/*
	if (typeof config.hostname === "string") {
		add_app_pre(config, {
			"name": "hostname",
			"config": {
				"name": config.hostname
			}
		});
		delete(config.hostname);
	}
	*/
	// server to ws-server.server
	if (typeof config.server === "number") {
		add_app(config, {
			"name": "ws-server",
			"config": {
				"server": config.server
			}
		});
		delete(config.server);
	}
	// removes to ws (node, subscribe to arrays)
	if (Array.isArray(config.remote)) {
		config.remote.forEach(function(c) {
			add_app(config, {
				"name": "ws",
				"config": c
			});
		});
		delete(config.remote);
	}

	exports.update_apps(config.app);
	//console.error(JSON.stringify(config, undefined, "\t"));
	return config;
};
