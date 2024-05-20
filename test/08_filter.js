#!/usr/bin/env node

const helper = require("./helper_test.js");
const test = helper.test(__filename);

const osiota = require("../");
const main = new osiota();
const n = main.node("/test");

const EventEmitter = require('events');
const e = new EventEmitter();

const r1 = main.node("/").filter([
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
				"name": "random-in",
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
				"name": "random-in",
				"config": {
					"node": "/Hallo/Welt/abc",
					"metadata": {
						"type": "energy.data"
					},
					"delay": 100
				}
			},
			{
				"name": "random-in",
				"config": {
					"node": "/Guten Tag/1/2/3/4/5",
					"metadata": {
						"type": "energy.data"
					},
					"delay": 100,
					"cmin": 0,
					"cmax": 100,
					"exp": 5,
					"round": 0
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

