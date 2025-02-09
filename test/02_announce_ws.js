#!/usr/bin/env node
// This test shall connect a client to a websocket server.

const helper = require("./helper_test.js");
const test = helper.test(__filename);

function nodelist(m) {
	return helper.get_node_list(m.router).filter(function(n) {
		if (n === '/app/WebSocket Client') return false;
		if (n === '/Client/app/WebSocket Client') return false;
		if (n === '/app/ws') return false;
		if (n === '/app/ws-server') return false;
		if (n === '/app/WebSocket Server') return false;
		return true;
	});
}

const main = require("../");
const m_s = new main("Server");

test("wait started", async (t)=>{
	t.plan(1);
	t.timeoutAfter(1000);
	await m_s.config({
		"app": [{
			"name": "ws-server",
			"config": {
				"server": 8098
			}
		}]
	});
	if (m_s._started) {
		t.ok(1, "started - instantly");
		return;
	}
	await new Promise(resolve=>m_s.once("started", resolve));
	t.ok(1, "started");
});

const m_c = new main("Client");
test("define client", async (t)=>{
        t.plan(1);
	await m_c.config({
		"app": [{
			"name": "ws",
			"config": {
				"name": "server",
				"url": "ws://localhost:8098",
				"subscribe": "/",
				"node": ["/"]
			}
		}]
	});
	t.ok(1, "defined");
});

const n = m_c.node("/test");

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
	}, 20);
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

const n2 = m_s.node("/Client/test2");
test('client announce node', function (t) {
	t.plan(1);

	n2.announce();
	n2.publish({
		value: 1
	});

	t.deepEqual(nodelist(m_s), [ '/Client/test2' ], "node list");
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
	m_s.close();
	t.ok(1, "closed");
});
