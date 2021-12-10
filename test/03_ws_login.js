#!/usr/bin/env node
// This test shall connect two clients to a websocket server.
// The server is configured to check the requested url to verify clients.
// The client A shall connect sucessfully and list the node '/test'
// The client B shall not connect successfully and list no nodes.

var helper = require("./helper_test.js");
var test = helper.test(__filename);

var nodelist = function(m) {
	return helper.get_node_list(m.router).filter(function(n) {
		if (n === '/app/ws-requrl-login') return false;
		if (n === '/app/ws-server') return false;
		return true;
	});
}

var main = require("../");
var m_s = new main("Server");
m_s.config({
	"app": [{
		"name": "ws-requrl-login",
		"config": {
			"allowed_paths": [
				"/login123",
				"/login567"
			]
		}
	},{
		"name": "ws-server",
		"config": {
			"server": 8099
		}
	}]
});

test("wait started", function(t) {
	t.plan(1);
	m_s.on("started", function() {
		t.ok(1, "started");
	});
});
var m_a = new main("Client 1");
var m_b = new main("Client 2");

test("define clients", function(t) {
	t.plan(1);
	m_a.config({
		remote: [
			{
				name: "zwei",
				url: "ws://localhost:8099/login123",
				remote_basename: "",
				basename: "",
				subscribe: "/"
			}
		]
	});
	m_b.config({
		remote: [
			{
				name: "zwei",
				url: "ws://localhost:8099/login_invalid",
				remote_basename: "",
				basename: "",
				subscribe: "/"
			}
		]
	});
	t.ok(1, "defined");
});

var n = m_s.node("/test");
//var na = m_a.node("/Server/test");
//var nb = m_b.node("/Server/test");

test('server list nodes', function (t) {
	t.plan(1);
	t.deepEqual(nodelist(m_s), [], "node list");
});
test('client A list nodes', function (t) {
	t.plan(1);
	t.deepEqual(nodelist(m_a), [], "node list");
});
test('client B list nodes', function (t) {
	t.plan(1);
	t.deepEqual(nodelist(m_b), [], "node list");
});
test('server announce node', function (t) {
	t.plan(1);

	n.announce();
	n.publish(undefined, 1);

	t.deepEqual(nodelist(m_s), [ '/test' ], "node list");
});
test('client A announced node', function (t) {
	t.plan(1);
	setTimeout(()=>{
		t.deepEqual(nodelist(m_a), [ '/test' ], "connected");
	}, 2000);
});
test('client B announced node', function (t) {
	t.plan(1);
	setTimeout(()=>{
		t.deepEqual(nodelist(m_b), [ ], "not connected");
	}, 200);
});


test('close sever', function (t) {
	t.plan(1);
	//m.on("close", ()=>{ t.ok(1, "closed"); });
	//m2.on("close", ()=>{ t.ok(1, "closed"); });
	m_s.close();
	m_a.close();
	m_b.close();
	t.ok(1, "closed");
});
