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
				"name": "ws-server",
				"config": {
					"server": 8081
				}
			},
			{
				"name": "test-10"
			}
		]
	});
	t.deepEqual(main._config, {
		"app_dir": [ __dirname+"/" ],
		"app": [
			{
				"name": "ws-server",
				"config": {
					"server": 8081
				}
			},
			{
				"name": "test-10",
				"config": {}
			}
		]
	}, "configuration");
});
var a;
test('add app to config', function (t) {
	t.plan(1);

	a = main.application_loader.app_add("test-10", { option: 2});
	main.application_loader.app_add("test-10", { option: 3});

	t.deepEqual(main._config, {
		"app_dir": [ __dirname+"/" ],
		"app": [
			{
				"name": "ws-server",
				"config": {
					"server": 8081
				}
			},
			{
				"name": "test-10",
				"config": {}
			},
			{
				"name": "test-10",
				"config": { "option": 2 }
			},
			{
				"name": "test-10",
				"config": { "option": 3 }
			}
		]
	}, "configuration");
});

test('remove app from config', function (t) {
	t.plan(1);

	main.application_loader.app_remove(a);

	t.deepEqual(main._config, {
		"app_dir": [ __dirname+"/" ],
		"app": [
			{
				"name": "ws-server",
				"config": {
					"server": 8081
				}
			},
			{
				"name": "test-10",
				"config": {}
			},
			{
				"name": "test-10",
				"config": { "option": 3 }
			}
		]
	}, "configuration");
});

test('reload configuration', function (t) {
	t.plan(1);
	var s = main.reload(function(m) {
		main = m;

		t.ok(1, "reloaded");
	});
	// refire:
	s._onTimeout();
	s.close();
});

test('check config', function (t) {
	t.plan(1);

	t.deepEqual(main._config, {
		"app_dir": [ __dirname+"/" ],
		"app": [
			{
				"name": "ws-server",
				"config": {
					"server": 8081
				}
			},
			{
				"name": "test-10",
				"config": {}
			},
			{
				"name": "test-10",
				"config": { "option": 3 }
			}
		]
	}, "configuration");
});



test('close osiota', function (t) {
	t.plan(1);
	main.close();
	t.ok(1, "closed");
});

