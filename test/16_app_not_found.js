#!/usr/bin/env node

const helper = require("./helper_test.js");
const test = helper.test(__filename);

const osiota = require("../");
const main = new osiota();

main.config({
	"app_dir": __dirname+"/",
});

test('load app with error', async function (t) {
	t.plan(2);

	main.on("app_loading_error", function(e, app, node, l_app, l_app_config,
			auto_install, callback) {
		t.fail("loading error");
		callback(e);
	});

	// ignore console output:
	var console_error = console.error;
	console.error = function() {};

	const a = (await main.application_loader.startup(null, "test-16", {}))[0];

	console.error = console_error;

	t.equal(a._app, "test-16", "app name");

	t.equal(a._state, "ERROR_APP", "app state");
});

