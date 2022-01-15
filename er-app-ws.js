/*
app_config.remote_basename
app_config.basename
app_config.subscribe
*/

exports.init = function(node, app_config, main) {
	if (typeof app_config.url !== "string") {
		console.warn("Warning: Remote config options missing.", app_config);
		return;
	}
	var ws = this.create_websocket_client(app_config.url,
		app_config.node, app_config);

	if (typeof app_config.name === "string") {
		main.remotes[app_config.name] = ws;
	}

	return ws;
};

/**
 * [internal] Create Websocket client
 *
 * @todo TODO: Move code!
 * @deprecated
 * @private
 */
exports.create_websocket_client = function(url, nodes, config) {
	var main = this._main;
	var ws = require('./router_websocket_client').init(this._main, this._main.rpcstack, "", url);
	var remote_prefix = "";
	if (typeof config.remote_prefix === "string") {
		remote_prefix = config.remote_prefix;
	}
	if (typeof config.remote_basename === "string") {
		ws.remote_basename = remote_prefix + config.remote_basename;
	} else {
		ws.remote_basename = remote_prefix + "/" + this._main.router.name;
	}
	if (typeof config.basename === "string") {
		ws.basename = config.basename;
	}

	// data to UPSTREAM
	if (Array.isArray(nodes)) {
		if (!nodes.length) {
			ws.node_plocal(main.router.node("/"), "subscribe_announcement");
		}
		nodes.forEach(function(node) {
			ws.node_plocal(main.router.node(node), "subscribe_announcement");
		});
	} else if (typeof nodes === "string") {
		ws.node_plocal(main.router.node(nodes), "subscribe_announcement");
	} else if (nodes !== false) {
		ws.node_plocal(main.router.node("/"), "subscribe_announcement");
	}

	// data from UPSTREAM
	if (Array.isArray(config.subscribe)) {
		config.subscribe.forEach(function(s) {
			ws.subscribe_announcement(main.router.node(s));
		});
	} else if (typeof config.subscribe === "string") {
		/*
		 * NOTE: 'remote_basename' (see above) is added to
		 * 'config.subscribe'
		 */
		console.log("subscribe:", ws.remote_basename +config.subscribe);
		ws.subscribe_announcement(main.router.node(config.subscribe));
	}

	if (config.secure === true || config.secure === "true") {
		this._main.router.policy_checker.add_observed_connection(ws.wpath);
	}

	return ws;
};
