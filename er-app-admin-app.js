const fs = require("fs");

var add_listener = function(config, callback) {
	if (typeof config === "object") {
		config.__listener = callback;
		Object.defineProperty(config, '__listener',
				{enumerable: false});

		for (var k in config) {
			add_listener(config[k], callback);
		}
	}
}
var publish_config = function(node, config) {
	// clone object:
	config = JSON.parse(JSON.stringify(config));
	// remove app object:
	config.app = undefined;
	node.publish(undefined, config);
};

exports.init = function(node, app_config, main, host_info) {
	var nodes = [];

	var handle_app = function(a) {
		if (typeof a._node !== "object")
			return;
		if (typeof a._config !== "object")
			return;
		if (a._config.__is_persistent !== true)
			return;

		var cn = a._node.node("config");
		var schema;
		if (typeof a.get_schema === "function") {
			schema = a.get_schema(main.application_manager.get_schema.bind(main.application_manager));
		} else {
			schema = main.application_manager.get_schema(a._app);
		}
		cn.announce({
			type: "config.basic",
			schema: schema,
			extrabutton: ["reinit", "save"]
		});
		publish_config(cn, a._config);

		// add listener to config:
		add_listener(a._config, function() {
			publish_config(cn, a._config);
		});

		cn.rpc_publish = function(reply, time, value) {
			// copy app object:
			value.app = a._config.app;
			a._config = main.config_update(value, a._config);
			publish_config(cn, value);
			reply(null, "ok");
		};
		cn.rpc_reinit = function(reply) {
			a._reinit();
			reply(null, "ok");
		};
		cn.rpc_save = function(reply) {
			if (main.emit("config_save")) {
				reply(null, "config saved");
			} else {
				reply("Error", "No save handler.");
			}
		};
		cn.rpc_list_applications = function(reply) {
			var list = main.application_manager.list_applications();
			reply(null, list);
		};
		cn.rpc_app_add = function(reply, app, settings) {
			main.app_add(app, settings, a._node, false, reply);
		};

		nodes.push(cn);
	}

	for (var app in main.apps) {
		var a = main.apps[app];
		handle_app(a);
	}
	main.on("app_init", handle_app);

	return [nodes, function() {
		main.removeListener("app_added", handle_app);
	}];
};

