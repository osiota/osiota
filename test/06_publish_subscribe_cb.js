#!/usr/bin/env node

const helper = require("./helper_test.js");
const test = helper.test(__filename);

const osiota = require("../");
const main = new osiota();

const n = main.node("/test1");
const n2 = main.node("/test2");
const n3 = main.node("/test3");

test('announce virtual node', function (t) {
	t.plan(10);
	t.timeoutAfter(400);

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
	t.timeoutAfter(400);

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
