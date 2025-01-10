#!/usr/bin/env node

const helper = require("./helper_test.js");
const test = helper.test(__filename);

const osiota = require("../");
const main = new osiota();

main.config({
	"app_dir": __dirname+"/",
});

test('load non existing app', function (t) {
	t.plan(3);
	t.timeoutAfter(100);

	main.on("app_loading_error", function(e, node, app, l_app_config,
			auto_install, callback) {
		t.equal(e.code, "OSIOTA_APP_NOT_FOUND", "error code");
	});

	var a = main.application_loader.startup(null, "test-not-found", {}, undefined, undefined, undefined, function(a) {
		t.ok(false, "fail");
		console.warn("app (inner)", a._app);
		throw new Error("Do not start this callback.");
	});

	t.equal(a._app, "test-not-found", "app name");

	t.equal(a._state, "ERROR_LOADING", "app state");
});

