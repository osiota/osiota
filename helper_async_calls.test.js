#!/usr/bin/env node

var helper = require("./test/helper_test.js");
var test = helper.test(__filename);

var async_calls = require("./helper_async_calls.js").async_calls;

test('async call data', function(t) {
	t.plan(1);
	async_calls(
		[
			function(callback) {
				callback(null, 0);
			},
			function(callback) {
				setTimeout(callback.bind(null, null, 1), 50);
			},
			function(callback) {
				setTimeout(callback.bind(null, null, 2), 100);
			},
		],
		function(err, results) {
			if (err) {
				console.error(err);
				t.fail("fetched error");
				return;
			}
			t.deepEqual(results, [0, 1, 2], "data");
		}
	);
});

test('async call error', function(t) {
	t.plan(1);
	async_calls(
		[
			function(callback) {
				callback(null, 0);
			},
			function(callback) {
				setTimeout(callback.bind(null, new Error("E1")), 50);
			},
			function(callback) {
				setTimeout(callback.bind(null, new Error("E2")), 10);
			},
		],
		function(err, results) {
			if (err) {
				t.deepEqual(err.message, "E2", "data");
				return;
			}
			t.fail("valid data");
		}
	);
});
