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

var Router = require("../router.js").router;

var r = new Router();

assert.deepEqual(gn(r), [], "no nodes");
console.log("nodes", gn(r));

var n = r.node("/test");

n.announce();

n.publish(undefined, 1);

assert.deepEqual(gn(r), [ '/test' ], "one node announced");
console.log("nodes", gn(r));

n.unannounce();

assert.deepEqual(gn(r), [], "no nodes");
console.log("nodes", gn(r));
