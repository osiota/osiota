#!/usr/bin/env node

const helper = require("./test/helper_test.js");
const test = helper.test(__filename);

const application_manager = require("./application_manager.js").application_manager;

const am = new application_manager({
	require: function(module_array, callback) {
		return callback(require("./" + module_array[1]));
	},
	app_dirs: ["./"],
});

test('get_schema', function(t) {
	t.plan(1);

	var schema_1 = am.get_schema("ws-server");
	t.deepEqual(schema_1,
		{ type: 'object', title: 'osiota Application WebSocket Server', properties: { server: { type: 'number', title: 'WebSocket Server Port' } }, additionalProperties: false },
		"schema");

});

test('get_schema - cached', function(t) {
	t.plan(1);

	var schema_1 = am.get_schema("ws-server");
	schema_1.cached = true;
	var schema_2 = am.get_schema("ws-server");
	t.deepEqual(schema_2,
		{ type: 'object', title: 'osiota Application WebSocket Server', properties: { server: { type: 'number', title: 'WebSocket Server Port' } }, additionalProperties: false, cached: true },
		"cached schema");
});

test('get_schema - default', function(t) {
	t.plan(1);

	// do not show warn message:
	var console_warn = console.warn;
	console.warn = function() {};

	var schema_3 = am.get_schema("not-existing");

	console.warn = console_warn;

	t.deepEqual(schema_3,
		{ type: 'object', title: 'Settings', additionalProperties: true },
		"default schema");
});

test('find_app', function(t) {
	t.plan(1);

	var app_name = am.find_app([{
		"app_type": "parser",
		"file_ext": "json",
		"file_name": "hallo.json"
	}]);

	t.deepEqual(app_name,
		"parse-json",
		"default schema");
});

test('list_applications', function(t) {
	t.plan(1);

	var apps = am.list_applications();
	t.deepEqual(apps.length > 0, true, "apps");
});
