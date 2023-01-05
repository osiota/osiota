#!/usr/bin/env node

const proxyquire = require('proxyquire');
const fs = require('fs');

var helper = require("./helper_test.js");
var test = helper.test(__filename);

console.group = function() {};
console.groupEnd = function() {};

var require_osiota = function(argv, callback) {
	var process_argv = ["node", __dirname + "/../osiota.js"];
	argv.forEach(function(a) {
		process_argv.push(a);
	});
	process.argv = process_argv;

	console_info = console.info;
	console.info = callback;
	console_error = console.error;
	console.error = callback;
	process_exit = process.exit;
	process.exit = function() {};

	//require("../osiota");
	proxyquire('../osiota.js',{
		"console-stamp": function() {},
	});
	console.info = console_info;
	console.error = console_error;
	process.exit = process_exit;
};

var log_file_match = function(check) {
	const log_file = __dirname + "/61_config.log";
	var log = fs.readFileSync(log_file);
	return !!(log.toString().match(check));
};


test('check', function (t) {
	t.plan(1);
	require_osiota(["--check", "--config", __dirname + "/61_config.json"], function(message) {
		t.equal(message, "Config is valid", "check output");
	});
});

test('start', function (t) {
	t.plan(1);
	require_osiota(["--config", __dirname + "/61_config.json", "--daemon"], function() {
	});
	setTimeout(function() {
		t.ok(log_file_match(/  Hello World!$/m), "check log file");
	}, 200);
});

test('restart', function (t) {
	t.plan(1);
	require_osiota(["--config", __dirname + "/61_config.json", "--restart"], function() {
	});
	setTimeout(function() {
		t.ok(log_file_match(/  Hello World!$/m), "check log file");
	}, 100);
});


/*
test('reload', function (t) {
	t.plan(1);
	require_osiota(["--config", __dirname + "/61_config.json", "--reload"], function() {
	});
	setTimeout(function() {
		t.ok(log_file_match(/^reloading config \.\.\.$/m), "check log file");
	}, 5100);
});
*/
test('status', function (t) {
	t.plan(1);
	require_osiota(["--config", __dirname + "/61_config.json", "--status"], function() {
		t.deepEqual(Array.prototype.slice.call(arguments),
			["Status:", "running"], "check output");
	});
});

test('stop', function (t) {
	t.plan(1);
	require_osiota(["--config", __dirname + "/61_config.json", "--stop"], function() {
	});
	setTimeout(function() {
		t.ok(log_file_match(/  Goodbye!$/m), "check log file");
	}, 1000);
});

test('status', function (t) {
	t.plan(1);
	require_osiota(["--config", __dirname + "/61_config.json", "--status"], function() {
		t.deepEqual(Array.prototype.slice.call(arguments),
			["Status:", "stopped"], "check output");
	});
});
