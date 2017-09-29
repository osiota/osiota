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

main_web.prototype.require = function(appname, callback) {
	if (appname.match(/\//)) {
		appname += "_web.js";
	} else {
		appname += "/web.js";
	}
	require_web("apps/" + appname, function(err, object) {
		//if (err)

		callback(object);	
	});
};

module.exports = main_web;

