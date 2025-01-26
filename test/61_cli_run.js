#!/usr/bin/env node

const proxyquire = require('proxyquire');
const fs = require('fs/promises');

const helper = require("./helper_test.js");
const test = helper.test(__filename);

console.group = function() {};
console.groupEnd = function() {};

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

const log_file = __dirname + "/61_config.log";
const pid_file = __dirname + "/61_config.pid";

async function log_file_match(check) {
	return helper.try_multiple_times(async ()=>{
		const log = await fs.readFile(log_file);
		return !!(log.toString().match(check));
	});
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
	try {
		await fs.truncate(log_file, 0);
		await fs.unlink(pid_file);
	} catch(err) {}
	await require_osiota(["--config", __dirname + "/61_config.json", "--daemon"], function() {
	});
	t.ok(await log_file_match(/  Hello World!$/m), "check log file");
});

test('status', async function (t) {
	t.plan(2);
	await require_osiota(["--config", __dirname + "/61_config.json", "--status"], function() {
		t.deepEqual(Array.prototype.slice.call(arguments),
			["Status:", "running"], "check output");
	});
	t.ok(true, "wait");
});

test('restart', async function (t) {
	t.plan(1);
	try {
		await fs.truncate(log_file, 0);
	} catch(err) {}
	await require_osiota(["--config", __dirname + "/61_config.json", "--restart"], function() {
	});
	t.ok(await log_file_match(/  Hello World!$/m), "check log file");
});


/*
test('reload', async function (t) {
	t.plan(1);
	await require_osiota(["--config", __dirname + "/61_config.json", "--reload"], function() {
	});
	t.ok(await log_file_match(/^reloading config \.\.\.$/m), "check log file");
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
	await require_osiota(["--config", __dirname + "/61_config.json", "--verbose", "--stop"], function() {
	});
	t.ok(await log_file_match(/  Goodbye!$/m), "check log file");
});

test('status', async function (t) {
	t.plan(2);
	await require_osiota(["--config", __dirname + "/61_config.json", "--status"], function() {
		t.deepEqual(Array.prototype.slice.call(arguments),
			["Status:", "stopped"], "check output");
	});
	t.ok(true, "wait");
});
