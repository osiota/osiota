
const process = require("process");

// from: er-app-template:
var obj_set = function(obj, key, value) {
	if (!Array.isArray(key)) {
		key = key.split(/\./).map(function(k) {
			if (k.match(/^\d+$/))
				k = k*1;
			return k;
		});
	}
	var k = key.shift();
	if (key.length == 0) {
		obj[k] = value;
	} else {
		if (typeof obj[k] !== "object") {
			if (typeof k === "number") {
				obj[k] = [];
			} else {
				obj[k] = {};
			}
		}
		obj_set(obj[k], key, value);
	}
}


exports.init = function(node, app_config, main) {
	if (!main.argv || !Array.isArray(main.argv._)) {
		throw new Error("main.argv not set.");
	}
	if (!Array.isArray(app_config.args)) {
		throw new Error("args not defined.");
	}
	var set_all = true;
	app_config.args.forEach(function(key, i) {
		if (typeof main.argv._[i] !== "undefined") {
			var value = main.argv._[i];
			console.log("argv setting:", key, value);
			obj_set(main._config, key, value);
		} else {
			set_all = false;
		}
	});
	if (app_config.force && !set_all) {
		console.warn("not all arguments set. Arguments:");
		app_config.args.forEach(function(key, i) {
			console.warn([i], key);
		});
		process.exit(2);
	}
};

