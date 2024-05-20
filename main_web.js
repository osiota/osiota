var main = require("./main.js");
var util = require('util');

class main_web extends main {
	constructor(router_name) {
		// Configure history module
		this.history_config = {
			"type": "global",
			"submodules": [{
				"type": "filter",
				"interval": 0,
				"submodules": [{
					"type": "memory",
					"max_data": 3000
				}]
			},{
				"type": "remote"
			}]
		};

		super(router_name);
	}

	app_to_path(appname, filename) {
		appname = appname.replace(/^(er|osiota)-app-/, "");
		if (appname.match(/\//)) {
			appname += "-" + filename;
		} else {
			appname += "/" + filename;
		}

		return "node_modules/osiota-app-" + appname;
	}

	require(appname, callback) {
		// map app to path:
		var path = this.app_to_path(appname, "web.js");
		this.require_web(path, callback);
	};
	load_schema(appname, callback) {
		callback(null, {});
		/*var path = this.app_to_path(appname, "web-schema.json");
		this.require_web(path, function(err, object) {
			//if (err)
			callback(object);
		});*/
	};

	require_web() {
		console.error("This function has to be overwritten!")
	};
}

module.exports = main_web;

