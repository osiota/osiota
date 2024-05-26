#!/usr/bin/env node

const helper = require("./helper_test.js");
const test = helper.test(__filename);

const Router = require("../router.js").router;
const r = new Router();
const n = r.node("/test");
const n2 = r.node("/test2");

function sleep(ms) {
	return new Promise(resolve=>setTimeout(resolve, ms));
}

n.rpc_tick_reply = function(reply, data, t) {
	t.equal(this.name, "/test", "node name");
	t.equal(data, "data", "node data");
	reply(null, "okay");
};
n.rpc_tick_async = async function(data, t) {
	t.equal(this.name, "/test", "node name");
	t.equal(data, "data", "node data");
	await sleep(1);
	return "okay";
};
n.rpc_tick_promise = function(reply, data, t) {
	t.equal(this.name, "/test", "node name");
	t.equal(data, "data", "node data");
	return new Promise((resolve)=>{
		setTimeout(function() {
			resolve("okay");
		}, 1);
	});
};
n.announce();
n2.rpc_tick_reply = function(reply, data, t) {
	t.equal(this.name, "/test2", "node name");
	t.equal(data, "data", "node data");
	reply("error", "errdata");
};
n2.rpc_tick_async = async function(data, t) {
	t.equal(this.name, "/test2", "node name");
	t.equal(data, "data", "node data");
	await sleep(1);
	throw "error";
};
n2.rpc_tick_promise = function(reply, data, t) {
	t.equal(this.name, "/test2", "node name");
	t.equal(data, "data", "node data");
	return new Promise((resolve, reject)=>{
		setTimeout(function() {
			reject("error");
		}, 1);
	});
};
n2.announce();

const tfuncs = ["tick_reply", "tick_async", "tick_promise"];
for (const tfunc of tfuncs) {
	test('rpc call: '+tfunc, function (t) {
		t.plan(5);
		n.rpc(tfunc, "data", t, function(err, rdata) {
			t.equal(this.name, "/test", "node name");
			t.equal(err, null, "node err data");
			t.equal(rdata, "okay", "node return data");
		});
	});
	test('rpc call with error: '+tfunc, function (t) {
		t.plan(4);
		n2.rpc(tfunc, "data", t, function(err, rdata) {
			t.equal(this.name, "/test2", "node name");
			t.equal(err, "error", "node err data");
			//t.equal(rdata, "errdata", "node return data");
		});
	});

	test('rpc async call: '+tfunc, async function (t) {
		t.plan(3);
		var rdata = await n.async_rpc(tfunc, "data", t);
		t.equal(rdata, "okay", "node return data");
	});
	test('rpc async call with error: '+tfunc, async function (t) {
		t.plan(3);
		try {
			var rdata = await n2.async_rpc(tfunc, "data", t);
			t.ok(0, "Failed");
		} catch (err) {
			t.equal(err, "error", "node err data");
		}
	});

	test('rpc cache call: '+tfunc, async function (t) {
		t.plan(7);
		var rpc_cb = n.rpc_cache(tfunc);
		t.equal(typeof rpc_cb, "function", "cb is function");

		var rdata = await rpc_cb("data", t);
		t.equal(rdata, "okay", "node return data");
		var rdata2 = await rpc_cb("data", t);
		t.equal(rdata2, "okay", "node return data");
	});
	test('rpc cache call: '+tfunc, async function (t) {
		t.plan(7);
		var rpc_cb = n2.rpc_cache(tfunc);
		t.equal(typeof rpc_cb, "function", "cb is function");

		try {
			var rdata = await rpc_cb("data", t);
			t.ok(0, "Failed");
		} catch(err) {
			t.equal(err, "error", "node err data");
		}
		try {
			var rdata = await rpc_cb("data", t);
			t.ok(0, "Failed");
		} catch(err) {
			t.equal(err, "error", "node err data");
		}
	});
}
