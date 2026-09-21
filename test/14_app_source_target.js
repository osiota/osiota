#!/usr/bin/env node

const helper = require("./helper_test.js");
const test = helper.test(__filename);

const osiota = require("../");
const main = new osiota();
const apps = main.application_loader.apps;

var a;
var b;
test('load apps', async function (t) {
	t.plan(2);
	await main.config({
		"app_dir": __dirname+"/",
		"app": [
			{
				"name": "test-10",
				"config": {
					"node": "converter",
					"source": "sensor/temp",
					"target": "out/value"
				}
			},
			{
				"name": "test-10",
				"config": {
					"node": "plain"
				}
			}
		]
	});
	a = apps["test-10"];
	b = apps["test-10 2"];

	t.equal(a.node.name, "/app/converter", "node of app a");
	t.equal(b.node.name, "/app/plain", "node of app b");
});

test('source_path and target_path are announced', function (t) {
	t.plan(2);
	t.equal(a.node.metadata.source_path, "../sensor/temp", "source_path");
	t.equal(a.node.metadata.target_path, "../out/value", "target_path");
});

test('source_path and target_path default to the base node', function (t) {
	t.plan(2);
	t.equal(b.node.metadata.source_path, "..", "source_path");
	t.equal(b.node.metadata.target_path, "..", "target_path");
});

test('paths are only added to the node of the app', function (t) {
	t.plan(3);
	const n = main.node("/sensor/temp");
	n.announce({"type": "test"});

	t.equal(n.metadata.type, "test", "metadata announced");
	t.equal(n.metadata.source_path, undefined, "no source_path");
	t.equal(n.metadata.target_path, undefined, "no target_path");
});

test('announced metadata wins over the calculated path', function (t) {
	t.plan(1);
	a.node.announce({"source_path": "../elsewhere"}, true);

	t.equal(a.node.metadata.source_path, "../elsewhere", "source_path");
});

test('relative_path of a missing node', function (t) {
	t.plan(2);
	const n = main.node("/test");
	t.equal(n.relative_path(undefined), undefined, "undefined node");
	t.equal(n.relative_path(main.node("/test/sub")), "sub", "node");
});
