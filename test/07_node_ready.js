#!/usr/bin/env node

var EnergyRouter = require("../");
var main = new EnergyRouter();


var r1 = main.node("/Hallo/Welt").ready("announce", function(method) {
	console.log("[1] node is ready:", method);

	return function() {
		console.log("[1] node is closed.");
	};
});

var r2 = main.node("/Hallo/Welt").ready(function(method) {
	console.log("[2] node is ready:", method);

	return function() {
		console.log("[2] node is closed.");
	};
});

var s = main.node("/").subscribe_announcement("announce", function(node) {
	return node.subscribe(function() {
		console.log(this.name+":", this.value);
	});
});


main.config({
	"app": [
		{
			"name": "er-app-random-in",
			"config": {
				"node": "/Hallo/Welt",
				"delay": 100
			}
		}
	]
});

r2.remove();


setTimeout(function() {
	s.remove();
}, 1000);

setTimeout(function() {
	console.log(Object.keys(main.apps));

	main.apps["er-app-random-in"]._unload();
}, 3000);
