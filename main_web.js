var main = require("./main.js");
var util = require('util');

function main_web(router_name) {

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

	main.call(this);
};
util.inherits(main_web, main);

main_web.prototype.app_to_path = function(appname) {
	appname = appname.replace(/^er-app-/, "");
	if (appname.match(/\//)) {
		appname += "-web.js";
	} else {
		appname += "/web.js";
	}

	return "node_modules/er-app-" + appname;
}

main_web.prototype.require = function(appname, callback) {
	// map app to path:
	var path = this.app_to_path(appname);
	this.require_web(path, function(err, object) {
		//if (err)
		callback(object);
	});
};

main_web.prototype.require_web = function() {
	console.error("This function has to be overwritten!")
};

module.exports = main_web;

