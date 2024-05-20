#!/usr/bin/env node

const helper = require("./helper_test.js");
const test = helper.test(__filename);

const osiota = require("../");
const main = new osiota();

main.config({
	"app": [
		{
			"name": "execcommand",
			"config": {
				"node": "/say",
				"command": "echo",
				"args": [
					"Hallo"
				],
				"map_stdout": true
			}
		}
	]
});

var n = main.node("/say");

test('app execcommand', function (t) {
	t.plan(1);

	n.subscribe(function() {
		if (this.time === null) return;
		console.log("data:", this.value);
		t.equal(this.value, "Hallo World", "published value");
	});

	n.rpc("set", "World");
});

