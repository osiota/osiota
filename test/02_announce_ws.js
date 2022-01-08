#!/usr/bin/env node
// This test shall connect a client to a websocket server.

var helper = require("./helper_test.js");
var test = helper.test(__filename);

var nodelist = function(m) {
	return helper.get_node_list(m.router).filter(function(n) {
		if (n === '/app/WebSocket Client') return false;
		if (n === '/Client/app/WebSocket Client') return false;
		if (n === '/app/ws') return false;
		if (n === '/app/ws-server') return false;
		if (n === '/app/WebSocket Server') return false;
		return true;
	});
}

var main = require("../");
var m_s = new main("Server");
m_s.config({
	"app": [{
		"name": "ws-server",
		"config": {
			"server": 8098
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

var m_c = new main("Client");
test("define client", function(t) {
        t.plan(1);
	m_c.config({
		"app": [{
			"name": "ws",
			"config": {
				"name": "server",
				"url": "ws://localhost:8098",
				"subscribe": "/"
			}
		}]
	});
	t.ok(1, "defined");
});

var n = m_c.node("/test");
var n2 = m_s.node("/Client/test2");

test('client list nodes', function (t) {
	t.plan(1);
	t.deepEqual(nodelist(m_c), [], "node list");
});
test('server list nodes', function (t) {
	t.plan(1);
	t.deepEqual(nodelist(m_s), [], "node list");
});
test('client announce node', function (t) {
	t.plan(1);

	n.announce();
	n.publish(undefined, 1);

	t.deepEqual(nodelist(m_c), [ '/test' ], "node list");
});
test('check server announced node', function (t) {
	t.plan(1);
	setTimeout(()=>{
		t.deepEqual(nodelist(m_s), [ '/Client/test' ], "node list");
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
	}, 200);
});

test('client announce node', function (t) {
	t.plan(1);

	n2.announce();
	n2.publish(undefined, 1);

	t.deepEqual(nodelist(m_s), [ '/Client/test2' ], "node list");
});
test('check server announced node', function (t) {
	t.plan(1);
	setTimeout(()=>{
		t.deepEqual(nodelist(m_c), [ '/test2' ], "node list");
	}, 200);
});

test('close sever', function (t) {
	t.plan(1);
	//m_c.on("close", ()=>{ t.ok(1, "closed"); });
	//m_s.on("close", ()=>{ t.ok(1, "closed"); });
	m_c.close();
	m_s.close();
	t.ok(1, "closed");
});
