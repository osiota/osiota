#!/usr/bin/env node

const helper = require("./helper_test.js");
const test = helper.test(__filename);

const osiota = require("../");
const main = new osiota();

main.config({
	"app_dir": __dirname+"/",
});

test('load non existing app', async function (t) {
	t.plan(3);
	t.timeoutAfter(100);

	main.on("app_loading_error", function(e, app, node, l_app, l_app_config,
			auto_install, callback) {
		t.equal(e.code, "OSIOTA_APP_NOT_FOUND", "error code");
		callback(e);
	});

	const a = (await main.application_loader.startup(null, "test-not-found"))[0];
	t.equal(a._app, "test-not-found", "app name");

	t.equal(a._state, "ERROR_LOADING", "app state");
});

