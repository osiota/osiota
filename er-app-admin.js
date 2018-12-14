const fs = require("fs");

exports.init = function(node, app_config, main, host_info) {
	var schema = require(__dirname + "/schema_config.json");
	schema.properties.app.items.oneOf =
		main.application_manager.load_schema_apps(main.app_dirs);

	node.announce({
		type: "config.basic",
		schema: schema,
		extrabutton: "save"
	});
	node.publish(undefined,
		require("./" + main._config.config)
	);
	node.rpc_publish = function(reply, time, value) {
		//if (main.config_update)
		//	value = main.config_update(value);
		node.publish(undefined,
			value
		);
		reply(null, "ok");
	};
	node.rpc_save = function(reply) {
		var value = node.value;
		console.info("saving config", value);
		if (main.emit("config_save")) {
			reply(null, "config saved");
		} else {
			reply("Error", "No save handler.");
		}
	};

	return [node];
};
