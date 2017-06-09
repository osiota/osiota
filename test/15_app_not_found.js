#!/usr/bin/env node

var EnergyRouter = require("../");

var main = new EnergyRouter();

main.config({
	"app_dir": __dirname+"/",
	"app": [
		{
			"name": "er-app-test-10"
		}
	]
});


main.on("app_loading_error", function(e, node, app, l_app_config, host_info, auto_install, callback) {
	if (e.hasOwnProperty("code") && e.code === "ER_APP_NOT_FOUND") {
		console.log("name", e.code);
		this.startup(node, "er-app-test-10", l_app_config,
				host_info, auto_install, callback);
	} else {
		console.error("error starting app:", e.stack || e);
	}
});

var a = main.startup(null, "er-app-test-not-found", {});

console.log("app", a._app);

