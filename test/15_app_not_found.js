#!/usr/bin/env node

var helper = require("./helper_test.js");
var test = helper.test(__filename);

var osiota = require("../");
var main = new osiota();

main.config({});

test('load non existing app', function (t) {
	t.plan(2);

	main.on("app_loading_error", function(e, node, app, l_app_config,
			host_info, auto_install, callback) {
		t.equal(e.code, "OSIOTA_APP_NOT_FOUND", "error code");
	});

	var a = main.application_loader.startup(null, "er-app-test-not-found", {}, undefined, undefined, function(a) {
		throw new Error("Do not start this callback.");
		console.warn("app (inner)", a._app);
	});

	if (a)
		console.warn("app", a._app);

	t.equal(a._state, "ERROR_LOADING", "app state");
});

