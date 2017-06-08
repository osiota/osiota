const fs = require("fs");

exports.init = function(node, app_config, main, host_info) {
	var n = node.node("config.config.object");
	var schema = require(__dirname + "/schema_config.json");
	schema.properties.app.items.oneOf = load_schema_apps(main);
		
	n.announce({
		type: "config.object",
		schema: schema,
		extrabutton: "save"
	});
	n.publish(undefined,
		require("./" + main._config.config)
	);
	n.rpc_publish = function(reply, time, value) {
		n.publish(undefined,
			value
		);
		reply(null, "ok");
	};
	n.rpc_save = function(reply) {
		var value = n.value;
		console.info("saving config", value);
		fs.writeFile("./" + main._config.config,
				JSON.stringify(value, null, '\t'),
				function(err) {
			if (err) {
				reply(err);
				return;
			}
			reply(null, "config saved to file '" +
					main._config.config + "'");
		});
	};
};

var read_schema_file = function(file, cb) {
	var data = fs.readFileSync(file);
	var json = JSON.parse(data);
	return json;
};

var create_default_schema = function(file) {
	return {
		"type": "object",
		"title": "Settings",
		"additionalProperties": true,
		"options": {
			"disable_properties": false,
			"disable_edit_json": false
		}
	};
}

var load_schema_file = function(file) {
	try {
		var stats = fs.statSync(file);
		// if is_dir
		if (stats.isDirectory()) {
			return read_schema_file(file + "/schema_config.json");
		}
		// if is_file
		else if (stats.isFile()) {
			if (file.match(/\.(js|coffee)$/)) {
				return read_schema_file(
					file.replace(/\.(js|coffee)$/i, '') +
					"-schema.json"
				);
			} else {
				return null;
			}
		}
	} catch(e) {
	}
	return create_default_schema(file);
};

var load_schema_apps_in_dir = function(dir, schema) {
	// read dir
	var files = fs.readdirSync(dir);
	// for files in dir
	files.forEach(function(file) {
		// filter
		if (file.match(/^er-app-/)) {
			var name = file.replace(/\.(js|coffee)$/, "");
			var short_name = name.replace(/^er-app-/, "");
			var sub_schema = load_schema_file(dir+file)
			if (sub_schema === null)
				return;

			sub_schema.title = "Settings";

			var schema_a = {
				"type": "object",
				"title": short_name,
				"properties": {
					"name": {
						"type": "string",
						"enum": [
							name,
							short_name
						],
						"options": {
							"hidden": true
						}
					 },
					"config": sub_schema
				},
				"required": [ "name" ],
				"additionalProperties": false,
				"options": {
					"disable_collapse": false
				}
			};
			schema.push(schema_a);
			console.log(short_name, sub_schema);
		}
	});
};

var add_default_schema = function(schema) {
	var sub_schema = create_default_schema();
	var schema_a = {
		"type": "object",
		"title": "Sonstiges ...",
		"properties": {
			"disabled": {
				"type": "string",
				"enum": ["disabled"],
				"options": {
					"hidden": true
				}
			},
			"name": {
				"type": "string",
			 },
			"config": sub_schema
		},
		"required": [ "name", "disabled" ],
		"additionalProperties": false,
		"options": {
			"disable_collapse": false
		}
	};

	schema.unshift(schema_a);
}

var load_schema_apps = function(main) {
	var schema_apps = [];
	main.app_dirs.forEach(function(app_dir) {
		if (app_dir == "") {
			app_dir = "./node_modules/"
		}
		load_schema_apps_in_dir(app_dir, schema_apps);
	};

	schema_apps.sort(function(a, b) {
		return a.title == b.title ? 0 : (
			a.title < b.title ? -1 : 1
		);
	});

	add_default_schema(schema_apps);

	return schema_apps;
};

load_schema_apps();
