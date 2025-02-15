#!/usr/bin/env node

const helper = require("./test/helper_test.js");
const test = helper.test(__filename);

const merge = require("./helper_merge_data.js").merge;

test('merge data', function(t) {
	t.plan(1);

	const config = {
		"app": [{
			"name": "debug-echo",
			"config": {
				"text": "hello world!",
				"hi": 7
			}
		},{
			"name": "debug-echo",
			"config": {
				"text": "hello world!"
			}
		},{
			"name": "debug-echo",
			"config": {
				"text": "abc"
			}
		}, null, undefined, "Hallo"]
	};

	const config_new = JSON.parse(JSON.stringify(config));

	config_new.app[1].name = "hi";

	//config_new.app.splice(1, 1);
	//config_new.app.unshift({"name": "hallowelt"});

	config_new.app.push({"name": "hallowelt"});
	config_new.app.push({"name": "hallowelt"});
	//console.info(JSON.stringify(config_new, undefined, "  "));

	const m = merge(config, config_new);

	t.deepEqual(m, config_new, "config object");
});

test('merge array data', function(t) {
	t.plan(1);
	const array = ["ABC", 8, {"name": 7}, 11, "DEF"];
	const array_new = JSON.parse(JSON.stringify(array));
	array_new[1] = 9;
	array_new.push("Hallo");
	const a = merge(array, array_new);
	t.deepEqual(a, array_new, "config object");
});

test('merge array data 2', function(t) {
	t.plan(1);
	const array = ["ABC", 8, {"name": 7}, 11, "DEF"];
	const array_new = JSON.parse(JSON.stringify(array));
	array_new.pop();
	array_new.pop();
	array_new.pop();
	const a = merge(array, array_new);
	t.deepEqual(a, array_new, "config object");
});

test('merge data', function(t) {
	t.plan(1);

	const config = {
		"abc": {
			"name": "debug-echo",
			"config": {
				"text": "hello world!",
				"hi": 7
			}
		}
	};

	const config_new = JSON.parse(JSON.stringify(config));

	delete config_new.abc.config.hi;
	config_new.abc.config.hallo = 8;

	config_new.abc.name = "hallo";

	//console.info(JSON.stringify(config_new, undefined, "  "));

	const m = merge(config, config_new);

	t.deepEqual(m, config_new, "config object");
});


test('merge simple data', function(t) {
	t.plan(1);
	const n = merge("abc", "def");
	t.deepEqual(n, "def", "config object");
});

test('error cases', function(t) {
	t.plan(2);
	const n = merge([1, 2, 3], {"hi": "def"});
	t.deepEqual(n, {"hi": "def"}, "config object");
	const n2 = merge({"hi": 7}, [1, 2, 3]);
	t.deepEqual(n2, [1, 2, 3], "config object");
});
