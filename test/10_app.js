#!/usr/bin/env node

var helper = require("./helper_test.js");
var test = helper.test(__filename);

var osiota = require("../");
var main = new osiota();

const EventEmitter = require('events');
var e = new EventEmitter();

var a;
test('load app test-10', function (t) {
	t.plan(1);
	main.config({
		"app_dir": __dirname+"/",
		"app": [
			{
				"name": "test-10"
			}
		]
	});
	a = main.apps["test-10"];
	a.eventemitter = e;

	// is synchron:
	t.equal(main.apps["test-10"]._id, "test-10", "app name");
});

test('reload app test-10', function (t) {
	t.plan(2);
	e.once("unload", () => { t.ok(1, "app A unloaded"); });
	e.once("init", () => { t.ok(1, "app A inited"); });
	main.apps["test-10"]._reinit();
});

test('unload app test-10', function (t) {
	t.plan(2);
	e.once("unload", () => { t.ok(1, "app A unloaded"); });
	main.apps["test-10"]._unload();
	// is synchron:
	t.equal(main.apps["test-10"]._state, "UNLOADED", "state of app");
});

var b;
test('load app test-10-b', function (t) {
	t.plan(1);
	b = main.startup_struct(undefined, {
		"name": "test-10-b"
	});
	b.eventemitter = e;

	// is synchron:
	t.equal(main.apps["test-10-b"]._id, "test-10-b", "app name");
});
test('reload app test-10-b', function (t) {
	t.plan(2);

	e.once("reinit", () => { t.ok(1, "app B reinited"); });

	b._reinit();
	setTimeout(function() {
		t.equal(main.apps["test-10-b"]._state, "RUNNING", "state of app");
	}, 200);
});

test('unload app test-10-b', function (t) {
	t.plan(2);
	e.once("unload", () => { t.ok(1, "app B unloaded"); });
	b._unload();
	setTimeout(function() {
		t.equal(main.apps["test-10-b"]._state, "UNLOADED", "state of app");
	}, 200);
});

var c;
test('load app test-10-c', function (t) {
	t.plan(1);
	c = main.startup_struct(undefined, {
		"name": "test-10-c"
	});
	c.eventemitter = e;

	// is synchron:
	t.equal(main.apps["test-10-c"]._id, "test-10-c", "app name");
});

test('reload app test-10-c', function (t) {
	t.plan(2);
	e.once("unload", () => { t.ok(1, "app C unloaded"); });
	e.once("init", () => { t.ok(1, "app C inited"); });
	main.apps["test-10-c"]._reinit();
});

test('unload app test-10-c', function (t) {
	t.plan(2);
	setTimeout(()=>{
		e.once("unload", () => { t.ok(1, "app C unloaded"); });
		main.apps["test-10-c"]._unload();
		// is synchron:
		t.equal(main.apps["test-10-c"]._state, "UNLOADED", "state of app");
	}, 100);
});
/*
c._reinit();
setTimeout(()=>{
	c._unload();
},100);

var d = main.startup_struct(undefined, {
	"name": "test-10-d"
});

setTimeout(function() {
	d._unload();
}, 100);


*/
