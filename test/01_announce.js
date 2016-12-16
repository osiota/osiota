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

var Router = require("../router.js").router;

var r = new Router();

console.log("nodes", gn(r));

var n = r.node("/test");

n.announce();

n.publish(undefined, 1);

console.log("nodes", gn(r));

n.unannounce();

console.log("nodes", gn(r));

var nodes = gn(r);
if (nodes.length === 0) {
	console.log("okay");
}
