#!/usr/bin/env node

const helper = require("./helper_test.js");
const test = helper.test(__filename);

const osiota = require("../");
const main = new osiota();

main.config({
	"app_dir": __dirname+"/",
});

test('load app with error', function (t) {
	t.plan(2);

	main.on("app_loading_error", function(e, node, app, l_app_config,
			auto_install, callback) {
		t.fail("loading error");
	});

	// ignore console output:
	var console_error = console.error;
	console.error = function() {};

	var a = main.application_loader.startup(null, "test-16", {}, undefined, undefined, undefined, function(a) {
		t.fail("loaded");
		console.warn("app (inner)", a._app);
		throw new Error("Do not start this callback.");
	});

	console.error = console_error;

	t.equal(a._app, "test-16", "app name");

	t.equal(a._state, "ERROR_STARTING", "app state");
});

