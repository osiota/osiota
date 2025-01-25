#!/usr/bin/env node

const proxyquire = require('proxyquire');

const helper = require("./helper_test.js");
const test = helper.test(__filename);

console.group = function() {};
console.groupEnd = function() {};

async function require_osiota(argv, callback) {
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

	let throw_error = null;
	let module;
	try {
		//require("../osiota");
		module = proxyquire('../osiota.js',{
			"console-stamp": function() {},
		});
	} catch(err) {
		throw_error = err;
	}

	if (module && module.loaded) {
		await module.loaded;
	}

	if (callback) {
		console.info = console_info;
		console.error = console_error;
	}
	process.exit = process_exit;
	if (throw_error) throw throw_error;

	return module;
};


test('check', async function (t) {
	t.plan(2);
	const module = await require_osiota(["--check", "--config", __dirname + "/60_config.json"], function(message) {
		t.equal(message, "Config is valid", "check output");
	});
	t.ok(true, "wait");
});

test('check (invalid config)', async function (t) {
	t.plan(2);
	var done = false;
	await require_osiota(["--check", "--config", __dirname + "/60_config_invalid.json"], function(message) {
		if (done) return;
		t.equal(message, "Config is not valid", "check output");
		done = true;
	});
	t.ok(true, "wait");
});

test('check (invalid json config)', async function (t) {
	t.plan(1);
	try {
		await require_osiota(["--check", "--config", __dirname + "/60_config_invalid_json.json"]);
	} catch (err) {
		const node_major_version = process.versions.node.split('.')[0];

		t.equal(err.message, "Error reading config file", "Exception");
	}
});


test('help', async function (t) {
	t.plan(3);
	await require_osiota(["--help"], function(message) {
		if (message === 'Usage: osiota [args]\n') {
			t.equal(message, 'Usage: osiota [args]\n', "check output");
			return;
		}
		if (message.match(/^Options:/)) {
			t.ok(true, "check output");
			return;
		}
	});
	t.ok(true, "wait");
});

test('version', async function (t) {
	t.plan(2);
	await require_osiota(["--version"], function(message) {
		if (message.match(/^2\./)) {
			t.ok(true, "check output");
			return;
		}
	});
	t.ok(true, "wait");
});

test('app', async function (t) {
	t.plan(2);
	await require_osiota(["--app", "test-cli-app", "hallo", "hi"], function() {
		t.deepEqual(Array.prototype.slice.call(arguments),
			["args:", [ 'hallo', 'hi' ]], "check output");
	});
	t.ok(true, "wait");
});

test('app help', async function (t) {
	t.plan(2);
	await require_osiota(["--app", "test-cli-app", "--help"], function(message) {
		if (message === "App Options: none") {
			t.ok(true, "check output");
		}
	});
	t.ok(true, "wait");
});

test('start', async function (t) {
	t.plan(2);
	await require_osiota(["--config", __dirname + "/60_config.json"], function() {
		t.deepEqual(Array.prototype.slice.call(arguments),
			['Hello World!'], "check output");
	});
	t.ok(true, "wait");
});
