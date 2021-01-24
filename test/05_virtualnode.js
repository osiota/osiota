#!/usr/bin/env node

var helper = require("./helper_test.js");
var test = helper.test();

var Router = require("../router.js").router;
var r = new Router();
var n = r.node("/test");

test('client list nodes', function (t) {
	t.plan(1);
	t.deepEqual(helper.get_node_list(r), [], "node list");
});

var vn = null;
test('announce virtual node', function (t) {
	t.plan(2);

	vn = n.virtualnode();
	var i = 0;
	var s = vn.subscribe(function(do_not_add_to_history, initial) {
		//console.warn("data", this.time, this.value, initial);
		if (i++ == 0)
			t.equal(this.value, 1, "published value");
	});
	vn.announce();
	vn.publish(undefined, 1);

	t.deepEqual(helper.get_node_list(r), [], "node list");
});

test('unannounce virtual node', function (t) {
	t.plan(1);

	vn.unannounce();
	t.deepEqual(helper.get_node_list(r), [], "node list");
});
