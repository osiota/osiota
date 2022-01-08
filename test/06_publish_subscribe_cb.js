#!/usr/bin/env node

var helper = require("./helper_test.js");
var test = helper.test(__filename);

var osiota = require("../");
var main = new osiota();

var n = main.node("/test1");
var n2 = main.node("/test2");
var n3 = main.node("/test3");

test('announce virtual node', function (t) {
	t.plan(10);

	// 1 ... 10
	var i = 0;
	var s = n.subscribe(function(do_not_add_to_history, initial) {
		//console.warn("data", this.time, this.value, initial);
		i++;
		t.equal(this.value, i, "published value");
		if (i == 10) {
			s.remove();
			main.close();
		}
	});

	main.config({
		"app_dir": __dirname+"/",
		"app": [
			{
				"name": "test-linear",
				"config": {
					"node": "/test1",
					"delay": 10
				}
			}
		]
	});
});
test('announce virtual node', function (t) {
	t.plan(10);

	// 10 ... 19 (i: 11 ... 20)
	var i = 0;
	var s = n3.subscribe(function(do_not_add_to_history, initial) {
		//console.warn("data2", this.time, this.value, initial);
		i++;
		t.equal(this.value, i, "published value");
		if (i == 10) {
			s.remove();
			main.close();
		}
	});
	n2.subscribe(n3.publish_subscribe_cb());

	main.config({
		"app_dir": __dirname+"/",
		"app": [
			{
				"name": "test-linear",
				"config": {
					"node": "/test2",
					"delay": 10
				}
			}
		]
	});
});

test('close sever', function (t) {
	t.plan(1);
	main.close();
	t.ok(1, "closed");
});
