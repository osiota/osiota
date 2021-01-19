#!/usr/bin/env node

const assert = require('assert').strict;

var config = {
	"app": [{
		"name": "debug-echo",
		"config": {
			"text": "hello world!"
		}
	},{
		"name": "debug-echo",
		"config": {
			"text": "hello world!"
		}
	}]
};

var config_new = JSON.parse(JSON.stringify(config));

config_new.app.unshift({"name": "hallowelt"});

//config_new.app.splice(3, 1);
config_new.app[1].name = "hallo";

config_new.app.push({"name": "hallowelt"});
config_new.app.push({"name": "hallowelt"});

var merge = require("./helper_merge_data.js").merge;

var m = merge(config, config_new);
console.log("new", config_new.app);
console.log("NEW", m.app);

console.log("equal", JSON.stringify(m) == JSON.stringify(config_new));

assert.deepEqual(m, config_new, "config object are not equal");
