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

main.app_add("er-app-test-10", {});

console.log("config", main._config);

setTimeout(function() {
	main.reload(function(m) {
		main = m;	
	});
}, 100);


setTimeout(function() {
	console.log("config", main._config);
	main.close();
}, 3000);


