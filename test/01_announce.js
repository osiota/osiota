#!/usr/bin/env node

const helper = require("./helper_test.js");
const test = helper.test(__filename);

const Router = require("../router.js").router;
const r = new Router();
const n = r.node("/test");

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
