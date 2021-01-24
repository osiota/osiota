#!/usr/bin/env node

var EnergyRouter = require("../");
var main = new EnergyRouter();

main.config({
	"app_dir": __dirname+"/",
	"app": [
		{
			"name": "er-app-install-apps-git",
			"config": {
				"auto_install_missing_apps": true,
				"install_dir": "./"
			}

		},
		{
			"name": "er-app-test-10"
		},
		{
			"name": "er-app-rest-api/index"
		}
	]
});

setTimeout(function() {
	main.close();
}, 5000);

