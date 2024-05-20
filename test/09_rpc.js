#!/usr/bin/env node

const helper = require("./helper_test.js");
const test = helper.test(__filename);

const Router = require("../router.js").router;
const r = new Router();
const n = r.node("/test");
const n2 = r.node("/test2");

test('rpc call', function (t) {
	t.plan(5);
	n.rpc_tick = function(reply, data) {
		t.equal(this.name, "/test", "node name");
		t.equal(data, "data", "node data");
		reply(null, "okay");
	};
	n.announce();
	n.rpc("tick", "data", function(err, rdata) {
		t.equal(this.name, "/test", "node name");
		t.equal(err, null, "node err data");
		t.equal(rdata, "okay", "node return data");
	});
});

test('rpc call with error', function (t) {
	t.plan(5);
	n2.rpc_tick = function(reply, data) {
		t.equal(this.name, "/test2", "node name");
		t.equal(data, "data", "node data");
		reply("error", "errdata");
	};
	n2.announce();
	n2.rpc("tick", "data", function(err, rdata) {
		t.equal(this.name, "/test2", "node name");
		t.equal(err, "error", "node err data");
		t.equal(rdata, "errdata", "node return data");
	});
});
