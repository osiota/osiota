#!/usr/bin/env node

const proxyquire = require('proxyquire');

var helper = require("./test/helper_test.js");
var test = helper.test(__filename);


test('read & write', function(t) {
	t.plan(3);
	var config_file = proxyquire("./helper_config_file.js", {
		"fs": {
			readFileSync: function(filename) {
				return '{"hi": 5}';
			},
			writeFile: function(filename, content) {
				t.equal(filename, "config.json", "filename");
				t.deepEqual(content, '{\n\t"hi": 7\n}\n', "content");
			},
		}
	});
	t.deepEqual(config_file.read("config.json"),
			{"hi": 5}, "config structure");
	config_file.write("config.json", {"hi": 7});

});

