#!/usr/bin/env node

var helper = require("./helper_test.js");
var test = helper.test(__filename);

var osiota = require("../");
var main = new osiota();
var n = main.node("/test");

const EventEmitter = require('events');
var e = new EventEmitter();

var r1 = main.node("/").filter([
	{
		"nodes": ["/Guten Tag/1/2/3/4/5"]
	},{
		"depth": 2,
		"metadata": {
			"type": "energy.data"
		}
	}
],"announce", function(node, method) {
	console.log("FILTER OKAY:", method, node.name);
	e.emit("announce", node.name);

	return function() {
		console.log("node is closed:", node.name);
	};
});

/*
FILTER OKAY: announce /Hallo/Welt
loading: random-in
startup: random-in
new node: /Hallo/Welt/abc
loading: random-in
startup: random-in
new node: /Guten Tag/1/2/3/4/5
FILTER OKAY: announce /Guten Tag/1/2/3/4/5
*/

test('filter callback', function (t) {
	t.plan(1);
	e.once("announce", (data)=>{
		t.equal(data, "/Hallo/Welt", "node was announced");
	});
	main.config({
		"app": [
			{
				"name": "er-app-random-in",
				"config": {
					"node": "/Hallo/Welt",
					"metadata": {
						"type": "energy.data"
					},
					"delay": 100
				}
			}
		]
	});
});


/*
var s = main.node("/").subscribe_announcement("announce", function(node) {
	return node.subscribe(function() {
		console.log(this.name+":", this.value);
	});
});
*/


test('filter callback', function (t) {
	t.plan(1);
	e.once("announce", (data)=>{
		t.equal(data, "/Guten Tag/1/2/3/4/5", "node was announced");
	});
	main.config({
		"app": [
			{
				"name": "er-app-random-in",
				"config": {
					"node": "/Hallo/Welt/abc",
					"metadata": {
						"type": "energy.data"
					},
					"delay": 100
				}
			},
			{
				"name": "er-app-random-in",
				"config": {
					"node": "/Guten Tag/1/2/3/4/5",
					"metadata": {
						"type": "energy.data"
					},
					"delay": 100
				}
			}
		]
	});
});

test('close', function(t) {
	t.plan(1);

	r1.remove();

	setImmediate(function() {
		main.close();
		t.ok(1, "closed");
	});
});

