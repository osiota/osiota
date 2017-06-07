#!/usr/bin/env node

var a1 = {};
a1.init = function(node, app_config, main, host_info) {
	console.log(this._id, app_config);
};

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

main.startup(null, a1, {test: 123});
