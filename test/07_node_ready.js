#!/usr/bin/env node

const helper = require("./helper_test.js");
const test = helper.test(__filename);

const osiota = require("../");
const main = new osiota();
const n = main.node("/test");

test('ready callback', function (t) {
	t.plan(1);
	t.timeoutAfter(100);
	const r1 = n.ready("announce", function(method) {
		console.log("[1] node is ready:", method);
		t.equal(method, "announce", "node is ready");

		return function() {
			console.log("[1] node is closed.");
		};
	});
	n.announce();
	r1.remove();
});
test('ready callback', function (t) {
	t.plan(1);
	t.timeoutAfter(100);
	const r1 = n.ready("announce", function(method) {
		console.log("[2] node is ready:", method);

		return function() {
			console.log("[2] node is closed.");
			t.ok(1, "node is unannounced");
		};
	});
	n.unannounce();
});

/*
var r2 = main.node("/Hallo/Welt").ready(function(method) {
	console.log("[2] node is ready:", method);

	return function() {
		console.log("[2] node is closed.");
	};
});

var s = main.node("/").subscribe_announcement("announce", function(node) {
	return node.subscribe(function() {
		console.log(this.name+":", this.value);
	});
});


main.config({
	"app": [
		{
			"name": "random-in",
			"config": {
				"node": "/Hallo/Welt",
				"delay": 100
			}
		}
	]
});

r2.remove();


setTimeout(function() {
	s.remove();
}, 1000);

setTimeout(function() {
	console.log(Object.keys(main.apps));

	main.apps["random-in"]._unload();
}, 3000);
*/
