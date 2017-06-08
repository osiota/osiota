#!/usr/bin/env node

var EnergyRouter = require("../");

var main = new EnergyRouter();

main.config({
	"app_dir": __dirname+"/",
	"app": [
		{
			"name": "er-app-test-10"
		}
	],
	"server": 8081
});


var a = main.app_add("er-app-test-10", {});

console.log("config", JSON.stringify(main._config, undefined, "  "));

main.app_remove(a);

console.log("config", JSON.stringify(main._config, undefined, "  "));

setTimeout(function() {
	main.close();
}, 100);

