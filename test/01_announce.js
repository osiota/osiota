#!/usr/bin/env node

var helper = require("./helper_test.js");
var test = helper.test(__filename);

var Router = require("../router.js").router;
var r = new Router();
var n = r.node("/test");

test('list nodes', function (t) {
	t.plan(1);
	t.deepEqual(helper.get_node_list(r), [], "node list");
});

test('announce node', function (t) {
	t.plan(1);
	n.announce();
	n.publish(undefined, 1);
	t.deepEqual(helper.get_node_list(r), [ '/test' ], "node list");
});

test('unannounce node', function (t) {
	t.plan(1);
	n.unannounce();
	t.deepEqual(helper.get_node_list(r), [], "node list");
});
