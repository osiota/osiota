#!/usr/bin/env node

var osiota = require("../../");
var main = new osiota();

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
