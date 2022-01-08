
const isObject = function(o) {
	return typeof o === "object" && o !== null;
};

exports.update_app = function(config) {
	if (!isObject(config)) return;
	if (typeof config.name === "string") {
		console.log("before:", config.name);
		config.name = config.name.replace(/^(er|osiota)-app-/, "");
		console.log("after:", config.name);
	}
};
exports._update_apps = function(config) {
	if (!Array.isArray(config)) {
		return;
	}
	config.forEach(function(a) {
		exports.update_app(a);
		if (isObject(a) && isObject(a.config)) {
			exports._update_apps(a.config.app);
		}
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

	exports._update_apps(config.app);
	console.error(JSON.stringify(config, undefined, "\t"));
	return config;
};
