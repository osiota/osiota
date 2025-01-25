#!/usr/bin/env node

const proxyquire = require('proxyquire');
const fs = require('fs');

const helper = require("./helper_test.js");
const test = helper.test(__filename);

console.group = function() {};
console.groupEnd = function() {};

function sleep(ms) {
	return new Promise(resolve=>setTimeout(resolve, ms));
}

async function require_osiota(argv, callback) {
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
	const module = proxyquire('../osiota.js',{
		"console-stamp": function() {},
	});
	if (module && module.loaded) {
		await module.loaded;
	}

	console.info = console_info;
	console.error = console_error;
	process.exit = process_exit;

	return module;
};

function log_file_match(check) {
	const log_file = __dirname + "/61_config.log";
	var log = fs.readFileSync(log_file);
	return !!(log.toString().match(check));
};


test('check', async function (t) {
	t.plan(2);
	await require_osiota(["--check", "--config", __dirname + "/61_config.json"], function(message) {
		t.equal(message, "Config is valid", "check output");
	});
	t.ok(true, "wait");
});

test('start', async function (t) {
	t.plan(1);
	await require_osiota(["--config", __dirname + "/61_config.json", "--daemon"], function() {
	});
	await sleep(200);
	t.ok(log_file_match(/  Hello World!$/m), "check log file");
});

test('restart', async function (t) {
	t.plan(1);
	await require_osiota(["--config", __dirname + "/61_config.json", "--restart"], function() {
	});
	await sleep(100);
	t.ok(log_file_match(/  Hello World!$/m), "check log file");
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
test('status', async function (t) {
	t.plan(2);
	await require_osiota(["--config", __dirname + "/61_config.json", "--status"], function() {
		t.deepEqual(Array.prototype.slice.call(arguments),
			["Status:", "running"], "check output");
	});
	t.ok(true, "wait");
});

test('stop', async function (t) {
	t.plan(1);
	await require_osiota(["--config", __dirname + "/61_config.json", "--stop"], function() {
	});
	await sleep(200);
	t.ok(log_file_match(/  Goodbye!$/m), "check log file");
});

test('status', async function (t) {
	t.plan(2);
	await require_osiota(["--config", __dirname + "/61_config.json", "--status"], function() {
		t.deepEqual(Array.prototype.slice.call(arguments),
			["Status:", "stopped"], "check output");
	});
	t.ok(true, "wait");
});
