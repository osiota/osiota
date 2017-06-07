#!/usr/bin/env node

var EnergyRouter = require("../");

var main = new EnergyRouter();

var Application = require("../application.js").application;

var a1 = new Application();
a1.init = function(node, app_config, main, host_info) {
	console.log(this._id, app_config);
};

//a1._init({def: 789});


main.config({
	"app_dir": __dirname+"/",
	"app": [
		{
			"name": "er-app-test-10"
		}
	]
});

main.startup(null, a1, {test: 123});
