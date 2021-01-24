#!/usr/bin/env node

process.env.OSIOTA_TEST = "1";
const assert = require('assert').strict;

// helper functions:
var gn = function(r) {
	var nodes = [];
	for (var nn in r.nodes) {
		var n = r.nodes[nn];
		if (n.metadata !== null) {
			nodes.push(nn);
		}
	}
	return nodes;
};

var main = require("../");

var m = new main("Eins");
m.config({
	remote: [
		{
			name: "zwei",
			url: "ws://localhost:8099"
		}
	]
});

var m2 = new main("Zwei");
m2.config({
	server: 8099
});


assert.deepEqual(gn(m.router), [], "no nodes -- 1");
console.log("eins nodes", gn(m.router));
assert.deepEqual(gn(m2.router), [], "no nodes -- 2");
console.log("zwei nodes", gn(m2.router));

var n = m.node("/test");

setTimeout(function() {
	console.log("ANNOUNCE");

	n.announce();
	n.publish(undefined, 1);
}, 1000);

setTimeout(function() {
	assert.deepEqual(gn(m.router), [ '/test' ], "Node test -- 1");
	console.log("eins nodes", gn(m.router));
	assert.deepEqual(gn(m2.router), [ '/Eins/test' ], "Remote node -- 2");
	console.log("zwei nodes", gn(m2.router));
}, 2000);

setTimeout(function() {
	console.log("UNANNOUNCE");

	n.unannounce();
}, 3000);
setTimeout(function() {
	assert.deepEqual(gn(m.router), [], "unannounce: no nodes -- 1");
	console.log("eins nodes", gn(m.router));
	assert.deepEqual(gn(m2.router), [], "unannounce: no nodes -- 2");
	console.log("zwei nodes", gn(m2.router));

	console.log("okay");
	m.close();
	m2.close();

}, 4000);
