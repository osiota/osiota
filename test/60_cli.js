#!/usr/bin/env node

const proxyquire = require('proxyquire');

var helper = require("./helper_test.js");
var test = helper.test(__filename);

console.group = function() {};
console.groupEnd = function() {};

var require_osiota = function(argv, callback) {
	var process_argv = ["node", "script"];
	argv.forEach(function(a) {
		process_argv.push(a);
	});
	process.argv = process_argv;

	if (callback) {
		console_info = console.info;
		console.info = callback;
		console_error = console.error;
		console.error = callback;
	}
	process_exit = process.exit;
	process.exit = function() {};

	var throw_error = null;
	try {
		//require("../osiota");
		proxyquire('../osiota.js',{
			"console-stamp": function() {},
		});
	} catch(err) {
		throw_error = err;
	}
	if (callback) {
		console.info = console_info;
		console.error = console_error;
	}
	process.exit = process_exit;
	if (throw_error) throw throw_error;
};


test('check', function (t) {
	t.plan(1);
	require_osiota(["--check", "--config", __dirname + "/60_config.json"], function(message) {
		t.equal(message, "Config is valid", "check output");
	});
});

test('check (invalid config)', function (t) {
	t.plan(1);
	var done = false;
	require_osiota(["--check", "--config", __dirname + "/60_config_invalid.json"], function(message) {
		if (done) return;
		t.equal(message, "Config is not valid", "check output");
		done = true;
	});
});

test('check (invalid json config)', function (t) {
	t.plan(1);
	var done = false;
	try {
		require_osiota(["--check", "--config", __dirname + "/60_config_invalid_json.json"]);
	} catch (err) {
		const node_major_version = process.versions.node.split('.')[0];
		// node v22:
		if (node_major_version < 20) {
			t.equal(err.message, "Unexpected token ] in JSON at position 83", "exception");
		// node v18 and before
		} else {
			t.equal(err.message, 'Expected \',\' or \'}\' after property value in JSON at position 83 (line 7 column 3)', 'exception');
		}
	}
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

test('app help', function (t) {
	t.plan(1);
	require_osiota(["--app", "test-cli-app", "--help"], function(message) {
		if (message === "App Options: none") {
			t.ok(true, "check output");
		}
	});
});

test('start', function (t) {
	t.plan(1);
	require_osiota(["--config", __dirname + "/60_config.json"], function() {
		t.deepEqual(Array.prototype.slice.call(arguments),
			['Hello World!'], "check output");
	});
});
