#!/usr/bin/env node

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

var main = require("../main.js");

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


console.log("eins nodes", gn(m.router));
console.log("zwei nodes", gn(m2.router));

var n = m.node("/test");

setTimeout(function() {
	console.log("ANNOUNCE");

	n.announce();
	n.publish(undefined, 1);
}, 1000);

setTimeout(function() {
	console.log("eins nodes", gn(m.router));
	console.log("zwei nodes", gn(m2.router));

}, 2000);

setTimeout(function() {
	console.log("UNANNOUNCE");

	n.unannounce();


}, 3000);
setTimeout(function() {
	console.log("eins nodes", gn(m.router));
	console.log("zwei nodes", gn(m2.router));

	var nodes = gn(m2.router);
	if (nodes.length === 0) {
		console.log("okay");
		m.close();
		m2.close();
	}

}, 4000);
