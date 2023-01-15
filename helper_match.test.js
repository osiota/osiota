#!/usr/bin/env node

var helper = require("./test/helper_test.js");
var test = helper.test(__filename);

var match = require("./helper_match").match;

var o1 = {
	"Hallo": "Welt",
	"Extra": 5
};

var p1_p = {
	"Hallo": "Welt"
};
var p1_n = {
	"Hallo": "World"
};

var p2_p = {
	"Hallo": /^Wo|^We/
};
var p2_n = {
	"Hallo": /^A|^B/
};

test("simple objects", function(t) {
	t.plan(2);

	t.ok(match(o1, p1_p), "match");
	t.ok(!match(o1, p2_n), "no match");
});

test("RegExp", function(t) {
	t.plan(2);

	t.ok(match(o1, p2_p), "match");
	t.ok(!match(o1, p2_n), "no match");
});
