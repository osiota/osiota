#!/usr/bin/env node

// helper functions:
var gn = function(r) {
	var nodes = [];
	for (var nn in r.nodes) {
		nodes.push(nn);
	}
	return nodes;
};

var Router = require("../router.js").router;

var r = new Router();

console.log("nodes", gn(r));

var n = r.node("/test");

var vn = n.virtualnode();

vn.subscribe(function() {
	console.log("data", this.time, this.value);
});

vn.announce();

vn.publish(undefined, 1);

console.log("nodes", gn(r));

vn.unannounce();

var n2 = vn.node("hallo");

console.log("nodes", gn(r));

