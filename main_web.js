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

	main.apply(this, arguments);
};
util.inherits(main_web, main);

main_web.prototype.app_to_path = function(appname, filename) {
	appname = appname.replace(/^(er|osiota)-app-/, "");
	if (appname.match(/\//)) {
		appname += "-" + filename;
	} else {
		appname += "/" + filename;
	}

	return "node_modules/osiota-app-" + appname;
}

main_web.prototype.require = function(appname, callback) {
	// map app to path:
	var path = this.app_to_path(appname, "web.js");
	this.require_web(path, callback);
};
main_web.prototype.load_schema = function(appname, callback) {
	callback(null, {});
	/*var path = this.app_to_path(appname, "web-schema.json");
	this.require_web(path, function(err, object) {
		//if (err)
		callback(object);
	});*/
};

main_web.prototype.require_web = function() {
	console.error("This function has to be overwritten!")
};

module.exports = main_web;

