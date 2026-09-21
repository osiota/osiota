#!/usr/bin/env node

const helper = require("./helper_test.js");
const test = helper.test(__filename);

const osiota = require("../");
const main = new osiota();
const apps = main.application_loader.apps;

const EventEmitter = require('events');
const e = new EventEmitter();

const rpc_deactivate = function(node, ...args) {
	return new Promise((resolve, reject)=>{
		node.rpc_deactivate(function(err, result) {
			if (err) return reject(err);
			resolve(result);
		}, ...args);
	});
};

var a;
var n;
test('load app test-12', async function (t) {
	t.plan(2);
	await main.config({
		"app_dir": __dirname+"/",
		"app": [
			{
				"name": "test-10"
			}
		]
	});
	a = apps["test-10"];
	a.eventemitter = e;
	n = a.node;

	t.equal(a.state, "running", "state of app");
	t.equal(n._app, a, "app is registered on node");
});

test('rpc deactivate app', async function (t) {
	t.plan(3);
	t.timeoutAfter(100);
	e.once("unload", () => { t.ok(1, "app unloaded"); });

	const result = await rpc_deactivate(n, true);
	t.equal(result, "okay", "rpc reply");
	t.equal(a.state, "deactive", "state of app");
});

test('rpc deactivate app again', async function (t) {
	t.plan(2);
	t.timeoutAfter(100);
	const fail = () => { t.fail("app should not be reloaded"); };
	e.once("unload", fail);
	e.once("init", fail);

	const result = await rpc_deactivate(n, true);
	t.equal(result, "okay", "rpc reply");
	t.equal(a.state, "deactive", "state of app");

	e.removeListener("unload", fail);
	e.removeListener("init", fail);
});

test('rpc activate app', async function (t) {
	t.plan(3);
	t.timeoutAfter(100);
	e.once("init", () => { t.ok(1, "app inited"); });

	const result = await rpc_deactivate(n, false);
	t.equal(result, "okay", "rpc reply");
	t.equal(a.state, "running", "state of app");
});

test('rpc activate app again', async function (t) {
	t.plan(2);
	t.timeoutAfter(100);
	const fail = () => { t.fail("app should not be reloaded"); };
	e.once("unload", fail);
	e.once("init", fail);

	const result = await rpc_deactivate(n, false);
	t.equal(result, "okay", "rpc reply");
	t.equal(a.state, "running", "state of app");

	e.removeListener("unload", fail);
	e.removeListener("init", fail);
});

test('rpc deactivate without argument', async function (t) {
	t.plan(2);
	t.timeoutAfter(100);
	try {
		await rpc_deactivate(n);
		t.fail("should throw");
	} catch(err) {
		t.ok(err instanceof Error, "error replied");
	}
	t.equal(a.state, "running", "state of app");
});

test('unload app test-12', async function (t) {
	t.plan(2);
	t.timeoutAfter(100);
	e.once("unload", () => { t.ok(1, "app unloaded"); });
	await a.stop();
	t.equal(a.state, "unloaded", "state of app");
});
