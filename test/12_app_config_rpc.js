#!/usr/bin/env node

var EnergyRouter = require("../");

var main = new EnergyRouter();

main.config({
	"app_dir": __dirname+"/",
	"app": [
		{
			"name": "er-app-test-10"
		},
		{
			"name": "analysis",
			"config": {}
		}
	]
});

main.node("/hallo.welt").rpc("analysis_add", "er-app-io-test-12", {
	"node": "Status.status.info",
	"source": "Energieverbrauch.energy.data"
},
		function(err, data) {
	if (err)
		console.log("err", err);
	console.log("data", data);

	console.log("config", JSON.stringify(main._config, undefined, "  "));
});
