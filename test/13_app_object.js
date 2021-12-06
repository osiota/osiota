#!/usr/bin/env node

var helper = require("./helper_test.js");
var test = helper.test(__filename);

var osiota = require("../");
var main = new osiota();
var Application = require("../application.js").application;

var a1 = {};
a1.init = function(node, app_config, main, host_info) {
	console.log(this._id, app_config);
};
var a2 = new Application("a2");
//a2._app = "a2";
a2.init = function(node, app_config, main, host_info) {
	console.log(this._id, app_config);
};

test('load config', function (t) {
	t.plan(1);

	main.config({
		"app_dir": __dirname+"/",
		"app": [
			{
				"name": "er-app-test-10"
			}
		]
	});
	t.deepEqual(Object.keys(main.apps), ['test-10'],"loaded apps");
});

test('startup subapps', function (t) {
	t.plan(3);

	main.startup(null, a1, {test: 123});
	t.deepEqual(Object.keys(main.apps), ['test-10', 'unknown'],
		"loaded apps");

	main.startup(null, a1, {test: 567});
	t.deepEqual(Object.keys(main.apps), ['test-10', 'unknown', 'unknown 2'
		], "loaded apps");

	main.startup(null, a2, {test: 890});
	t.deepEqual(Object.keys(main.apps), ['test-10', 'unknown', 'unknown 2',
			'a2'], "loaded apps");
});
