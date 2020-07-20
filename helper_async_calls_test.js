#!/usr/bin/env node

var async_calls = require("./helper_async_calls.js").async_calls;

async_calls(
	[
		function(callback) {
			setTimeout(callback.bind(null, 1), 500);
		},
		function(callback) {
			setTimeout(callback.bind(null, 2), 1000);
		},
	],
	function(results) {
		console.log(results);
	}
);
