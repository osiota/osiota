#!/usr/bin/env node

const helper = require("./test/helper_test.js");
const test = helper.test(__filename);

const match = require("./helper_match").match;

const o1 = {
	"Hallo": "Welt",
	"Extra": 5
};

const p1_p = {
	"Hallo": "Welt"
};
const p1_n = {
	"Hallo": "World"
};

const p2_p = {
	"Hallo": /^Wo|^We/
};
const p2_n = {
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
