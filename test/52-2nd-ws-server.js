#!/usr/bin/env node

var EnergyRouter = require("../");
var main = new EnergyRouter();

main.config({
	"app": [{
		"name": "ws-server",
		"config": {
			"server": 8090
		}
	},{
		"name": "ws-server",
		"config": {
			"server": 8091
		}
	}]
});

setTimeout(function() {
	main.close();
}, 2000);
		
