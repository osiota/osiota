#!/usr/bin/env node

const helper = require("./helper_test.js");
const test = helper.test(__filename);

const osiota = require("../");
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
	t.timeoutAfter(100);
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

test('reconfigure app', function (t) {
	var n = main.node("/app/test-10");
	t.plan(1);
	n.rpc("config", {
		"option": 4
	}, false, function(err) {
		t.ok(err === null, "configured");
	});
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
				"config": { "option": 4 }
			},
			{
				"name": "test-10",
				"config": { "option": 3 }
			}
		]
	}, "configuration");
});

test('reconfigure app - move node', function (t) {
	t.plan(6);
	var n = main.node("/app/test-10");
	var n2 = main.node("/app/test-10-1");
	var rp = n.relative_path(n2);
	t.equal(rp, "../test-10-1", "relative nodename");
	n.rpc("config_node", rp, function(err, message) {
		t.equal(err, "node_moved", "loaded");
		t.equal(message, "../test-10-1", "loaded");

		setTimeout(function() {
			//t.equal(n._app._state, "UNLOADED", "app unloaded");
			t.equal(n._app, undefined, "app unloaded");
			t.equal(n2._app._id, "test-10", "app loaded");
			t.equal(n2._app._state, "RUNNING", "app loaded");
		}, 10);
	});
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
				"config": {
					"option": 4,
					"node": "/app/test-10-1"
				 }
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

