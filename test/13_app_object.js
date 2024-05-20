#!/usr/bin/env node

const helper = require("./helper_test.js");
const test = helper.test(__filename);

const osiota = require("../");
const main = new osiota();
const Application = require("../application.js").application;
var application_loader = null;

var a1 = {};
a1.init = function(node, app_config, main, host_info) {
	console.log(this._id, app_config);
};
var a2 = new Application(application_loader, "a2");
//a2._app = "a2";
a2.init = function(node, app_config, main, host_info) {
	console.log(this._id, app_config);
};

test('load config', function (t) {
	t.plan(1);

	main.config({
		"app_dir": __dirname+"/",
		"hostname": "Test 13",
		"app": [
			{
				"name": "test-10"
			}
		]
	});
	t.deepEqual(Object.keys(main.apps), ['test-10'],"loaded apps");
});

test('startup subapps', function (t) {
	t.plan(3);

	main.application_loader.startup(null, a1, {test: 123});
	t.deepEqual(Object.keys(main.apps), ['test-10', 'unknown'],
		"loaded apps");

	main.application_loader.startup(null, a1, {test: 567});
	t.deepEqual(Object.keys(main.apps), ['test-10', 'unknown', 'unknown 2'
		], "loaded apps");

	main.application_loader.startup(null, a2, {test: 890});
	t.deepEqual(Object.keys(main.apps), ['test-10', 'unknown', 'unknown 2',
			'a2'], "loaded apps");
});

test('load config - subapps', function (t) {
	t.plan(1);

	main.config({
		"app_dir": __dirname+"/",
		"app": [
			{
				"name": "node",
				"config": {
					"node": "/hi",
					"metadata": {"hi": "hi"},
					"app": [{
						"name": "test-10"
					}]
				}
			}
		]
	});
	t.deepEqual(Object.keys(main.apps), ['test-10', 'unknown', 'unknown 2',
			'a2', 'node', 'test-10 2'], "loaded apps");
});
