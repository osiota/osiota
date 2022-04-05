#!/usr/bin/env node

var helper = require("./helper_test.js");
var test = helper.test(__filename);

var osiota = require("../");
var main = new osiota();

main.config({
	"app_dir": __dirname+"/",
	"save_history": false
});

const n = main.node("/test");
n.announce();

const ds = new Date()/1000;
for (var i=0; i<10; i++) {
	n.publish(ds+i, i);
}

const hc = function(t, exceeded_value, de_value) {
	t.timeoutAfter(100);
	t.plan(2);
	return function(data, exceeded) {
		var de = data.map(function(d) { return d.value; });
		t.equal(exceeded, exceeded_value, "exceeded marker");
		t.deepEqual(de, de_value, "history data");
		console.log("history", de, exceeded);
	};
};

test('default --- exceeding', function (t) {
	n.get_history({}, hc(t, true, [0,1,2,3,4,5,6,7,8,9]));
});

test('maxentries', function (t) {
	n.get_history({
		maxentries: 5
	}, hc(t, false, [5,6,7,8,9]));
});

test('maxentries', function (t) {
	n.get_history({
		maxentries: 5,
		reverse_align: false
	}, hc(t, false, [5,6,7,8,9]));
});

test('maxentries', function (t) {
	n.get_history({
		maxentries: 5,
		reverse_align: true
	}, hc(t, false, [0,1,2,3,4]));
});

test('maxentries', function (t) {
	n.get_history({
		maxentries: 10
	}, hc(t, false, [0,1,2,3,4,5,6,7,8,9]));
});

test('fromtime', function (t) {
	n.get_history({
		fromtime: ds+4+0.01
	}, hc(t, false, [5,6,7,8,9])); // 4 not included.
});

test('fromtime', function (t) {
	n.get_history({
		fromtime: ds+4
	}, hc(t, false, [5,6,7,8,9])); // 4 not included.
});

test('fromtime', function (t) {
	n.get_history({
		fromtime: ds+4-0.01
	}, hc(t, false, [4,5,6,7,8,9])); // 4 included
});

test('totime --- exceeding', function (t) {
	n.get_history({
		totime: ds+5
	}, hc(t, true, [0,1,2,3,4])); // 5 not included
});

test('totime --- exceeding', function (t) {
	n.get_history({
		totime: ds+5+0.01
	}, hc(t, true, [0,1,2,3,4,5])); // 5 included
});

test('fromtime future', function (t) {
	n.get_history({
		fromtime: ds+20
	}, hc(t, false, [])); // empty
});


test('fromtime (over) --- exceeding', function (t) {
	n.get_history({
		fromtime: ds-5
	}, hc(t, true, [0,1,2,3,4,5,6,7,8,9])); // full
});

test('totime --- exceeding', function (t) {
	n.get_history({
		totime: ds-5
	}, hc(t, true, [])); // empty
});


test('from/totime', function (t) {
	n.get_history({
		fromtime: ds+5,
		totime: ds+8
	}, hc(t, false, [6,7])); // range, 5 and 8 not included
});
