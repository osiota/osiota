#!/usr/bin/env node

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

var osiota = require("../");
var main = new osiota();

main.config({
	"app": [
	]
});

var node = main.node("/mymap");
var map;

test('Create Nodemap', function (t) {
	t.plan(13);

	var app_config = {
		"map": [{
			"map": "ABC",
			"extra": "Hallo"
		}, {
			"map": "GHI"
		}]
	};
	map = node.map(app_config, {
		"map_initialise": function(n, metadata, app_config) {
			console.error("NODE", n.name);
			if (n.name === "/mymap/key_ABC" ||
					n.name === "/mymap/key_DEF" ||
					n.name === "/mymap/key_GHI")
				t.ok(1, "initialise");
			n.announce(metadata);
		},
		"map_key": function(app_config, cache) {
			console.error("ac", app_config);
			var key = "key_" + app_config.map;
			console.error("ack", key);
			return key;
		},
		"map_extra_elements": true
	});
	var n1 = map.node("ABC");
	t.ok(n1 !== null, "node 1");
	t.equal(n1.name, "/mymap/key_ABC", "node 1 name");
	t.deepEqual(n1._config, {
		"map": "ABC",
		"node": "key_ABC",
		"extra": "Hallo"
	}, "node 1 config");
	var n2 = map.node("DEF");
	t.ok(n2 !== null, "node 2");
	t.equal(n2.name, "/mymap/key_DEF", "node 2 name");
	t.deepEqual(n2._config, {
		"map": "DEF",
		"node": "key_DEF"
	}, "node 2 config");

	var n3 = node.node("/mymap/key_GHI");
	t.ok(n3 !== null, "node 3");
	t.equal(n3.name, "/mymap/key_GHI", "node 3 name");
	t.deepEqual(n3._config, {
		"map": "GHI",
		"node": "key_GHI"
	}, "node 3 config");

	t.deepEqual(nodelist(main), ['/mymap/key_ABC', '/mymap/key_GHI', '/mymap/key_DEF'], "node list");
});


test('Nodemap.forEach', function (t) {
	t.plan(7);
	var f = map.forEach(function(node) {
		if (node.name === "/mymap/key_ABC")
			t.ok(1, "node");
		if (node.name === "/mymap/key_DEF")
			t.ok(1, "node");
		if (node.name === "/mymap/key_GHI")
			t.ok(1, "node");
		return function() {
			t.ok(1, "foreach cleaned");
		};
	});

	setTimeout(function() {
		t.equal(f.length, 4, "foreach cleaning length");
		f.forEach((e)=>{e()});
	}, 10);
});

test('Nodemap.on_rpc', function (t) {
	t.plan(4);
	map.on_rpc("tick", function(reply, data) {
		t.equal(this.name, "/mymap/key_JKL", "tick");
		t.equal(data, "J", "tick data");
		t.ok(1, "tick");
		reply(null, "okay");
	});
	map.node("JKL").rpc("tick", "J", function(data) {
		t.ok(1, "tick reply");
	});
});
