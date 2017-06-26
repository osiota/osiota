#!/usr/bin/env node

var EnergyRouter = require("../");
var main = new EnergyRouter();

var r1 = main.node("/").filter([
	{
		"nodes": ["/Guten Tag/1/2/3/4/5"]
	},{
		"depth": 2,
		"metadata": {
			"type": "energy.data"
		}
	}
],"announce", function(node, method) {
	console.log("FILTER OKAY:", method, node.name);

	return function() {
		console.log("node is closed:", node.name);
	};
});

/*
var s = main.node("/").subscribe_announcement("announce", function(node) {
	return node.subscribe(function() {
		console.log(this.name+":", this.value);
	});
});
*/


main.config({
	"app": [
		{
			"name": "er-app-random-in",
			"config": {
				"node": "/Hallo/Welt",
				"metadata": {
					"type": "energy.data"
				},
				"delay": 100
			}
		},
		{
			"name": "er-app-random-in",
			"config": {
				"node": "/Hallo/Welt/abc",
				"metadata": {
					"type": "energy.data"
				},
				"delay": 100
			}
		},
		{
			"name": "er-app-random-in",
			"config": {
				"node": "/Guten Tag/1/2/3/4/5",
				"metadata": {
					"type": "energy.data"
				},
				"delay": 100
			}
		}
	]
});

r1.remove();


setImmediate(function() {
	main.close();
});
