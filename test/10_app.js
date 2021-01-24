#!/usr/bin/env node

process.env.OSIOTA_TEST = "1";
console.debug = ()=>{};
console.log = ()=>{};

var EnergyRouter = require("../");
var main = new EnergyRouter();

main.config({
	"app_dir": __dirname+"/",
	"app": [
		{
			"name": "test-10"
		}
	]
});

main.apps["test-10"]._unload();

var b = main.startup_struct(undefined, {
	"name": "test-10-b"
});
b._reinit();
b._unload();

var c = main.startup_struct(undefined, {
	"name": "test-10-c"
});
c._reinit();
setTimeout(()=>{
	c._unload();
},100);

var d = main.startup_struct(undefined, {
	"name": "test-10-d"
});

setTimeout(function() {
	d._unload();
}, 100);

setTimeout(function() {
	var a = main.startup_struct(undefined, {
		"name": "test-10"
	});
	a._reinit();
	a._unload();
}, 0);

