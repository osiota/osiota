#!/usr/bin/env node

const helper = require("./helper_test.js");
const test = helper.test(__filename);

const osiota = require("../");
const main = new osiota();
const apps = main.application_loader.apps;

const EventEmitter = require('events');
const e = new EventEmitter();

var a;
test('load app test-10', async function (t) {
	t.plan(1);
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

	t.equal(apps["test-10"]._id, "test-10", "app name");
});

test('reload app test-10', function (t) {
	t.plan(2);
	t.timeoutAfter(100);
	e.once("unload", () => { t.ok(1, "app A unloaded"); });
	e.once("init", () => { t.ok(1, "app A inited"); });
	a.restart();
});
test('reload app test-10 with delay', function (t) {
	t.plan(3);

	e.once("unload", () => { t.ok(1, "app A unloaded"); });
	e.once("init", () => { t.ok(1, "app A inited"); });

	a.handle_restart(10);
	setTimeout(function() {
		t.equal(apps["test-10"].state, "running", "state of app");
	}, 20);
});

test('unload app test-10', function (t) {
	t.plan(2);
	t.timeoutAfter(100);
	e.once("unload", () => { t.ok(1, "app A unloaded"); });
	a.stop();
	// is synchron:
	t.equal(a.state, "unloaded", "state of app");
});

var b;
test('load app test-10-b', async function (t) {
	t.plan(1);
	const loaded_apps = await main.application_loader.startup_struct(undefined, {
		"name": "test-10-b"
	});
	b = await (loaded_apps[0]);
	b.eventemitter = e;

	// is synchron:
	t.equal(apps["test-10-b"]._id, "test-10-b", "app name");
});
test('reload app test-10-b', function (t) {
	t.plan(2);
	t.timeoutAfter(100);

	e.once("reinit", () => { t.ok(1, "app B reinited"); });

	b.restart();
	setTimeout(function() {
		t.equal(apps["test-10-b"].state, "running", "state of app");
	}, 20);
});

test('unload app test-10-b', function (t) {
	t.plan(2);
	t.timeoutAfter(100);
	e.once("unload", () => { t.ok(1, "app B unloaded"); });
	b.stop();
	setTimeout(function() {
		t.equal(b.state, "unloaded", "state of app");
	}, 20);
});

var c;
test('load app test-10-c', async function (t) {
	t.plan(1);
	const loaded_apps = await main.application_loader.startup_struct(undefined, {
		"name": "test-10-c"
	});
	c = await (loaded_apps[0]);
	c.eventemitter = e;

	t.equal(apps["test-10-c"]._id, "test-10-c", "app name");
});

test('reload app test-10-c', function (t) {
	t.plan(2);
	t.timeoutAfter(100);
	e.once("unload", () => { t.ok(1, "app C unloaded"); });
	e.once("init", () => { t.ok(1, "app C inited"); });
	c.restart();
});

test('unload app test-10-c', function (t) {
	t.plan(2);
	t.timeoutAfter(100);
	setTimeout(()=>{
		e.once("unload", () => { t.ok(1, "app C unloaded"); });
		c.stop();
		t.equal(c.state, "unloaded", "state of app");
	}, 20);
});
/*
c._reinit();
setTimeout(()=>{
	c._unload();
},100);

var d = main.application_loader.startup_struct(undefined, {
	"name": "test-10-d"
});

setTimeout(function() {
	d._unload();
}, 100);


*/
