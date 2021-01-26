#!/usr/bin/env node

var helper = require("./helper_test.js");
var test = helper.test(__filename);

var osiota = require("../");
var main = new osiota();

test('load config', function (t) {
	t.plan(1);
	main.config({
		"app_dir": __dirname+"/",
		"app": [
			{
				"name": "er-app-test-10"
			}
		],
		"server": 8081
	});
	t.deepEqual(main._config, {
		"app_dir": [ __dirname+"/" ],
		"app": [
			{
				"name": "er-app-test-10",
				"config": {}
			}
		],
		"server": 8081
	}, "configuration");
});
var a;
test('add app to config', function (t) {
	t.plan(1);

	a = main.app_add("er-app-test-10", { option: 2});
	main.app_add("er-app-test-10", { option: 3});

	t.deepEqual(main._config, {
		"app_dir": [ __dirname+"/" ],
		"app": [
			{
				"name": "er-app-test-10",
				"config": {}
			},
			{
				"name": "er-app-test-10",
				"config": { "option": 2 }
			},
			{
				"name": "er-app-test-10",
				"config": { "option": 3 }
			}
		],
		"server": 8081
	}, "configuration");
});

test('remove app from config', function (t) {
	t.plan(1);

	main.app_remove(a);

	t.deepEqual(main._config, {
		"app_dir": [ __dirname+"/" ],
		"app": [
			{
				"name": "er-app-test-10",
				"config": {}
			},
			{
				"name": "er-app-test-10",
				"config": { "option": 3 }
			}
		],
		"server": 8081
	}, "configuration");
});

test('reload configuration', function (t) {
	t.plan(1);
	main.reload(function(m) {
		main = m;

		t.ok(1, "reloaded");
	});
});

test('check config', function (t) {
	t.plan(1);

	t.deepEqual(main._config, {
		"app_dir": [ __dirname+"/" ],
		"app": [
			{
				"name": "er-app-test-10",
				"config": {}
			},
			{
				"name": "er-app-test-10",
				"config": { "option": 3 }
			}
		],
		"server": 8081
	}, "configuration");
});



test('close osiota', function (t) {
	t.plan(1);
	main.close();
	t.ok(1, "closed");
});

