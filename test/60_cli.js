#!/usr/bin/env node

const proxyquire = require('proxyquire');

var helper = require("./helper_test.js");
var test = helper.test(__filename);

console.group = function() {};
console.groupEnd = function() {};

var require_osiota = function(argv, callback) {
	var process_argv = ["node", "script", "--systemd"];
	argv.forEach(function(a) {
		process_argv.push(a);
	});
	process.argv = process_argv;

	console_info = console.info;
	console.info = callback;

	//require("../osiota");
	proxyquire('../osiota.js',{});
	console.info = console_info;
};


test('check', function (t) {
	t.plan(1);
	require_osiota(["--check", "--config", __dirname + "/60_config.json"], function(message) {
		t.equal(message, "Config is valid", "check output");
	});
});


test('help', function (t) {
	t.plan(2);
	require_osiota(["--help"], function(message) {
		if (message === 'Usage: osiota [args]\n') {
			t.equal(message, 'Usage: osiota [args]\n', "check output");
			return;
		}
		if (message.match(/^Options:/)) {
			t.ok(true, "check output");
			return;
		}
	});
});

test('version', function (t) {
	t.plan(1);
	require_osiota(["--version"], function(message) {
		if (message.match(/^2\./)) {
			t.ok(true, "check output");
			return;
		}
	});
});

test('app', function (t) {
	t.plan(1);
	require_osiota(["--app", "test-cli-app", "hallo", "hi"], function() {
		t.deepEqual(Array.prototype.slice.call(arguments),
			["args:", [ 'hallo', 'hi' ]], "check output");
	});
});

test('start', function (t) {
	t.plan(1);
	require_osiota(["--config", __dirname + "/60_config.json"], function() {
		t.deepEqual(Array.prototype.slice.call(arguments),
			['Hello World!'], "check output");
	});
});
