#!/usr/bin/env node

var helper = require("./helper_test.js");
var test = helper.test();

var main = require("../");
var m = new main("Eins");
m.config({
	remote: [
		{
			name: "zwei",
			url: "ws://localhost:8099",
			subscribe: "/"
		}
	]
});

var m2 = new main("Zwei");
m2.config({
	server: 8099
});

var n = m.node("/test");
var n2 = m2.node("/Eins/test2");

test('client list nodes', function (t) {
	t.plan(1);
	t.deepEqual(helper.get_node_list(m.router), [], "node list");
});
test('server list nodes', function (t) {
	t.plan(1);
	t.deepEqual(helper.get_node_list(m2.router), [], "node list");
});
test('client announce node', function (t) {
	t.plan(1);

	n.announce();
	n.publish(undefined, 1);

	t.deepEqual(helper.get_node_list(m.router), [ '/test' ], "node list");
});
test('check server announced node', function (t) {
	t.plan(1);
	setTimeout(()=>{
		t.deepEqual(helper.get_node_list(m2.router), [ '/Eins/test' ], "node list");
	}, 200);
});

test('client unannounce node', function (t) {
	t.plan(1);

	n.unannounce();

	t.deepEqual(helper.get_node_list(m.router), [ ], "node list");
});
test('check server node unannounced', function (t) {
	t.plan(1);
	setTimeout(()=>{
		t.deepEqual(helper.get_node_list(m2.router), [ ], "node list");
	}, 200);
});

test('client announce node', function (t) {
	t.plan(1);

	n2.announce();
	n2.publish(undefined, 1);

	t.deepEqual(helper.get_node_list(m2.router), [ '/Eins/test2' ], "node list");
});
test('check server announced node', function (t) {
	t.plan(1);
	setTimeout(()=>{
		t.deepEqual(helper.get_node_list(m.router), [ '/test2' ], "node list");
	}, 200);
});

test('close sever', function (t) {
	t.plan(1);
	//m.on("close", ()=>{ t.ok(1, "closed"); });
	//m2.on("close", ()=>{ t.ok(1, "closed"); });
	m.close();
	m2.close();
	t.ok(1, "closed");
});
