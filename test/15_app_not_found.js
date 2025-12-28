#!/usr/bin/env node

const helper = require("./helper_test.js");
const test = helper.test(__filename);

const osiota = require("../");
const main = new osiota();

main.config({
	"app_dir": __dirname+"/",
});

test('load non existing app', async function (t) {
	t.plan(2);
//	t.timeoutAfter(100);

	/*
	main.on("app_loading_error", function(e, app, node, l_app, l_app_config,
			auto_install, callback) {
		t.equal(e.code, "OSIOTA_APP_NOT_FOUND", "error code");
		callback(e);
	});
	*/

	const console_error = console.error;
	console.error = function() {};
	const loaded_apps = await main.application_loader.startup(null, "test-not-found");
	const a = loaded_apps[0];
	console.error = console_error;

	t.equal(a._app, "test-not-found", "app name");

	t.equal(a.state, "error_loading", "app state");
});

