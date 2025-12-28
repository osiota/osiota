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
//	t.timeoutAfter(100);

	const cb_install_app = function(app_name, e) {
		console.warn("INSTALL APP", app_name);
		t.equal(app_name, "test-not-found/abc", "app name cb");
		return false;
	};
	main.application_loader.add_installer(cb_install_app);

	const console_error = console.error;
	console.error = function() {};
	const loaded_apps = await main.application_loader.startup(null, "test-not-found/abc");
	const a = loaded_apps[0];
	console.error = console_error;

	t.equal(a._app, "test-not-found/abc", "app name");

	t.equal(a.state, "error_loading", "app state");

	main.application_loader.remove_installer(cb_install_app);
});


test('load non existing inherited app', async function (t) {
	t.plan(3);
//	t.timeoutAfter(100);

	const cb_install_app = function(app_name, e) {
		console.warn("INSTALL APP", app_name);
		t.equal(app_name, "test-not-found/abc", "app name cb");
		return false;
	};
	main.application_loader.add_installer(cb_install_app);

	const console_error = console.error;
	console.error = function() {};
	const loaded_apps = await main.application_loader.startup(null, "test-15b");
	const a = loaded_apps[0];
	console.error = console_error;

	t.equal(a._app, "test-15b", "app name");

	t.equal(a.state, "error_loading", "app state");

	main.application_loader.remove_installer(cb_install_app);
});

