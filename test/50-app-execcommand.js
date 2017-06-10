#!/usr/bin/env node

var EnergyRouter = require("../");
var main = new EnergyRouter();

main.config({
	"app": [
		{
			"name": "execcommand",
			"config": {
				"node": "/say",
				"command": "echo",
				"args": [
					"Hallo"
				],
				"map_stdout": true
			}
		}
	]
});

var n = main.node("/say");

n.subscribe(function() {
	if (this.time === null) return;
	console.log("data:", this.value);
});

n.rpc("set", "World");
