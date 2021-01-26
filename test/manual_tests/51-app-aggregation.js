#!/usr/bin/env node

var EnergyRouter = require("../");
var main = new EnergyRouter();

main.config({
	"app": [
		{
			"name": "random-in",
			"config": {
				"node": "/G1/EV",
				"metadata": {
					"type": "energy.data"
				}
			}
		},
		{
			"name": "random-in",
			"config": {
				"node": "/G2/EV",
				"metadata": {
					"type": "energy.data"
				}
			}
		},
		{
			"name": "random-in",
			"config": {
				"node": "/G3/T",
				"metadata": {
					"type": "temperature.data"
				}
			}
		},
		{
			"name": "aggregation",
			"config": {
				"node": "/EV",
				"metadata": {
					"type": "energy.data"
				},
				"type": "time",
				"interval": 5,
				"method": "integral_avg",
				"source": "/",
				"filter_depth": -1,
				"filter_metadata": {
					"type": "energy.data"
				}
			}
		}
	]
});

var n1 = main.node("/G1/EV");
n1.subscribe(function() {
	console.log("data", this.value);
});

var n2 = main.node("/G2/EV");
n2.subscribe(function() {
	console.log("data", this.value);
});


var n2 = main.node("/EV");
n2.subscribe(function() {
	console.log("===>", this.value);
});


