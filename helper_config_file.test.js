#!/usr/bin/env node

const proxyquire = require('proxyquire');

const helper = require("./test/helper_test.js");
const test = helper.test(__filename);


test('read', function(t) {
	t.plan(1);
	var config_file = proxyquire("./helper_config_file.js", {
		"fs": {
			readFileSync: function(filename) {
				return '{"hi": 5}';
			},
		}
	});
	t.deepEqual(config_file.read("config.json"),
			{"hi": 5}, "config structure");

});

test('write', function(t) {
	t.plan(2);
	var config_file = proxyquire("./helper_config_file.js", {
		"fs": {
			writeFile: function(filename, content, callback) {
				t.equal(filename, "config.json", "filename");
				t.deepEqual(content, '{\n\t"hi": 7\n}\n', "content");
				callback(null);
			},
		}
	});
	config_file.write("config.json", {"hi": 7});
});

test('read - not existing file', function(t) {
	t.plan(1);

	var config_file = proxyquire("./helper_config_file.js", {
		"fs": {
			readFileSync: function(filename) {
				var e = new Error("Not existing");
				e.code = "ENOENT";
				throw e;
			},
		}
	});

	// do not show warn message
	var console_warn = console.warn;
	console.warn = function() {};

	try {
		var c = config_file.read("notexisting");
	} catch(e) {
		t.deepEqual(e.message, "Error reading config file", "Exception");
	}

	console.warn = console_warn;
});


