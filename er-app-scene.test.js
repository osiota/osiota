#!/usr/bin/env node

const helper = require("./test/helper_test.js");
const test = helper.test(__filename);

const osiota = require("./");
const main = new osiota();

main.config({
	"app": [
		{
			"name": "scene",
			"config": {
				"node": "/scene",
				"target": "/",
				"target_filter": [{
					"nodes": ["/hallo", "/hi"]
				},{
					"nodes": ["/hi2"],
					"value": 2,
					"unset_value": 0
				}],
				"state": true
			}
		}
	]
});

var node = main.node("/scene");
var node_1 = main.node("/hallo");
node_1.rpc_set = function(reply, value, time) {
	//console.error("RPC SET 1", time, value);
	node_1.publish(time, value);
	reply(null, "okay");
};
var node_2 = main.node("/hi");
node_2.rpc_set = function(reply, value, time) {
	//console.error("RPC SET 2", time, value);
	node_2.publish(time, value);
	reply(null, "okay");
};
var node_3 = main.node("/hi2");
node_3.rpc_set = function(reply, value, time) {
	//console.error("RPC SET 3", time, value);
	node_3.publish(time, value);
	reply(null, "okay");
};

test('Wait', function(t) {
	t.plan(1);
	setTimeout(function() {
		t.ok(1);
	}, 100);
});

test('Scene: Init', function (t) {
	t.plan(1);

	t.equal(node.value, null, "node value");
});


test('Scene: Announce Nodes', function (t) {
	t.plan(1);
	node_1.announce({});
	node_2.announce({});
	node_3.announce({});

	t.equal(node.value, null, "node value");
});
test('Scene: Publish one node', function (t) {
	t.plan(1);

	node_1.publish(undefined, true);

	setTimeout(function() {
		t.equal(node.value, false, "node value");
	}, 100);
});
test('Scene: Publish all nodes', function (t) {
	t.plan(1);

	node_2.publish(undefined, true);
	node_3.publish(undefined, 2);

	setTimeout(function() {
		t.equal(node.value, true, "node value");
	}, 100);
});
test('Scene: Step 4', function (t) {
	t.plan(1);

	node_1.publish(undefined, false);

	setTimeout(function() {
		t.equal(node.value, false, "node value");
	}, 100);
});

test('Scene: Step 5', function (t) {
	t.plan(2);

	node_3.publish(undefined, 1);
	node.rpc("set", true);

	setTimeout(function() {
		t.equal(node.value, true, "node value");
		t.equal(node_3.value, 2, "node value");
	}, 100);
});
test('Scene: Step 6', function (t) {
	t.plan(2);

	node.rpc("set", false);

	setTimeout(function() {
		t.equal(node.value, false, "node value");
		t.equal(node_3.value, 0, "node value");
	}, 100);
});
test('Scene: Step 7', function (t) {
	t.plan(1);

	node_1.publish(undefined, true);
	node_2.unannounce({});
	node_3.unannounce({});

	setTimeout(function() {
		t.equal(node.value, true, "node value");
	}, 100);
});

test('Scene: Step 8', function (t) {
	t.plan(1);

	node_1.unannounce({});

	setTimeout(function() {
		t.equal(node.value, null, "node value");
	}, 100);
});

test('Scene: unsubscribe', function (t) {
	t.plan(1);


	setTimeout(function() {
		t.ok(1, "close");
	}, 100);
});
