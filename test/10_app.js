#!/usr/bin/env node

var EnergyRouter = require("../");

var main = new EnergyRouter();

main.config({
	"app_dir": __dirname+"/",
	"app": [
		{
			"name": "er-app-test-10"
		}
	]
});

main.apps["er-app-test-10"]._unload();

var b = main.startup_struct(undefined, {
	"name": "er-app-test-10-b"
});
b._reinit();
b._unload();

var c = main.startup_struct(undefined, {
	"name": "er-app-test-10-c"
});
c._reinit();
c._unload();

var d = main.startup_struct(undefined, {
	"name": "er-app-test-10-d"
});

setTimeout(function() {
	d._unload();
}, 100);

setTimeout(function() {
	var a = main.startup_struct(undefined, {
		"name": "er-app-test-10"
	});
	a._reinit();
	a._unload();
}, 0);

