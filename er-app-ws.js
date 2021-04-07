/*
app_config.remote_basename
app_config.basename
app_config.subscribe
*/

exports.init = function(node, app_config, main) {
	if (typeof app_config.url !== "string") {
		console.warn("Warning: Remote config options missing.", c);
		return;
	}
	var ws = main.create_websocket_client(app_config.url,
		app_config.node, app_config);

	if (typeof app_config.name === "string") {
		main.remotes[app_config.name] = ws;
	}

	return ws;
};
