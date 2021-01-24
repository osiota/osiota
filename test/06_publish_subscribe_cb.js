#!/usr/bin/env node

var EnergyRouter = require("../");
var main = new EnergyRouter();
console.debug = () => {};

main.config({
	"app_dir": __dirname+"/",
	"app": [
		{
			"name": "er-app-test-linear",
			"config": {
				"node": "/Hallo/Welt",
				"delay": 100
			}
		}
	]
});

var n = main.node("/Hallo/Welt");
var n2 = main.node("/Hello/World");

n2.subscribe(function() {
	console.log("data", this.value);
});

n.subscribe(n2.publish_subscribe_cb());

setTimeout(function() {
	main.close();
}, 2000);

