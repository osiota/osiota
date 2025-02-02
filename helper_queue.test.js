#!/usr/bin/env node

const helper = require("./test/helper_test.js");
const test = helper.test(__filename);

const queue = require("./helper_queue.js");


test('queue', function(t) {
	t.plan(2);
	let i = 0;
	const f = queue.queue(function(data) {
		if (i == 0) {
			t.deepEqual(data, [1, 2, 3], "queue data 1");
		} else {
			t.deepEqual(data, [4, 5], "queue data 2");
		}
	});
	f(1);
	f(2);
	f(3);
	setTimeout(function() {
		i++;
		f(4);
		f(5);
	}, 10);
});

test('queue_getter', function(t) {
	t.plan(2);
	let i = 0;
	const f = queue.queue_getter(function(getter) {
		if (i == 0) {
			t.deepEqual(getter(), [1, 2, 3], "queue data 1");
		} else {
			t.deepEqual(getter(), [4, 5], "queue data 2");
		}
	});
	f(1);
	f(2);
	f(3);
	setTimeout(function() {
		i++;
		f(4);
		f(5);
	}, 10);
});


test('no_queue', function(t) {
	t.plan(3);
	let i = 0;
	const f = queue.no_queue(function(data) {
		if (i == 0) {
			t.deepEqual(data, 1, "queue data 1");
		} else if (i == 1) {
			t.deepEqual(data, 2, "queue data 1");
		} else if (i == 2) {
			t.deepEqual(data, 3, "queue data 1");
		} else {
			t.fail();
		}
	});
	f(1);
	i++;
	f(2);
	i++;
	setTimeout(function() {
		f(3);
		i++;
	}, 10);
});
