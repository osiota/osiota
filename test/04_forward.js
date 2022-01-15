#!/usr/bin/env node
// This test shall connect a client to a websocket server.

var helper = require("./helper_test.js");
var test = helper.test(__filename);

var nodelist = function(m) {
	return helper.get_node_list(m.router).filter(function(n) {
		if (n === '/app/ws') return false;
		if (n === '/app/ws-server') return false;
		if (n === '/app/WebSocket Client') return false;
		if (n === '/app/WebSocket Server') return false;
		if (n === '/Forward/app/WebSocket Client') return false;
		if (n === '/Forward/app/WebSocket Server') return false;
		if (n === '/Forward/Client/app/WebSocket Client') return false;
		if (n === '/Client/app/WebSocket Client') return false;
		return true;
	});
}

var main = require("../");
var m_s = new main("Server");
m_s.config({
	"app": [{
		"name": "ws-server",
		"config": {
			"server": 8097
		}
	}]
});

test("wait started", function(t) {
	t.plan(1);
	if (m_s._started) {
		t.ok(1, "started - instantly");
		return;
	}
	m_s.once("started", function() {
		t.ok(1, "started");
	});
});

var m_f = new main("Forward");
test("define client", function(t) {
        t.plan(1);
	m_f.config({
		"app": [{
			"name": "ws-server",
			"config": {
				"server": 8096
			}
		},{
			"name": "ws",
			"config": {
				"name": "server",
				"url": "ws://localhost:8097",
				"subscribe": "/"
			}
		}]
	});
	t.ok(1, "defined");
});

var m_c = new main("Client");
test("define client", function(t) {
        t.plan(1);
	m_c.config({
		"app": [{
			"name": "ws",
			"config": {
				"name": "server",
				"url": "ws://localhost:8096",
				"subscribe": "/"
			}
		}]
	});
	t.ok(1, "defined");
});

test('client list nodes', function (t) {
	t.plan(1);
	t.deepEqual(nodelist(m_c), [], "node list");
});
test('server list nodes', function (t) {
	t.plan(1);
	t.deepEqual(nodelist(m_s), [], "node list");
});
var n;
test('client announce node', function (t) {
	t.plan(1);

	n = m_c.node("/test");
	n.announce();
	//n.publish(undefined, 1);

	t.deepEqual(nodelist(m_c), [ '/test' ], "node list");
});

var n_m;
test('client publish/subscribe node (historic)', function (t) {
	t.plan(1);

	n_m = m_s.node("/Forward/Client/test");
	n.publish(undefined, 42);
	var s = n_m.subscribe(function() {
		if (this.value === null) return;

		// unsubscribe
		s.remove();

		t.equal(this.value, 42, "subscribed");
	});
});


test('client publish/subscribe node (live)', function (t) {
	t.plan(1);

	/*
	 * Resubscribing means that an history rpc is called to sync
	 * the history.
	 */

	var s2 = n_m.subscribe(function() {
		if (this.value === null) return;
		if (this.value === 42) return;
		t.equal(this.value, 24, "subscribed");
		s2.remove();
	});

	setTimeout(function() {
		n.publish(undefined, 24);
	}, 100);
});

test('reverse rpc', function (t) {
	t.plan(5);
	n.rpc_tick = function(reply, data) {
		t.equal(this.name, "/test", "node name");
		t.equal(data, "data", "node data");
		reply(null, "okay");
	};
	n_m.rpc("tick", "data", function(err, rdata) {
		t.equal(this.name, "/Forward/Client/test", "node name");
		t.equal(err, null, "node err data");
		t.equal(rdata, "okay", "node return data");
	});
});

test('check server announced node', function (t) {
	t.plan(1);
	setTimeout(()=>{
		t.deepEqual(nodelist(m_s), [ '/Forward/Client/test' ], "node list");
	}, 200);
});

test('client unannounce node', function (t) {
	t.plan(1);

	n.unannounce();

	t.deepEqual(nodelist(m_c), [ ], "node list");
});
test('check server node unannounced', function (t) {
	t.plan(1);
	setTimeout(()=>{
		t.deepEqual(nodelist(m_s), [ ], "node list");
	}, 20);
});

var n2 = m_s.node("/Forward/Client/test2");
test('client announce node', function (t) {
	t.plan(1);

	n2.announce();
	n2.publish(undefined, 1);

	t.deepEqual(nodelist(m_s), [ '/Forward/Client/test2' ], "node list");
});
test('check server announced node', function (t) {
	t.plan(1);
	setTimeout(()=>{
		t.deepEqual(nodelist(m_c), [ '/test2' ], "node list");
	}, 20);
});

test('close sever', function (t) {
	t.plan(1);
	//m_c.on("close", ()=>{ t.ok(1, "closed"); });
	//m_s.on("close", ()=>{ t.ok(1, "closed"); });
	m_c.close();
	m_f.close();
	m_s.close();
	t.ok(1, "closed");
});
