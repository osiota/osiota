const fs = require("fs");

exports.init = function(node, app_config, main, host_info) {
	var schema = require(__dirname + "/schema_config.json");
	schema.properties.app.items.oneOf = load_schema_apps(main.app_dirs);
		
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

var read_schema_file = function(file) {
	try {
		var data = fs.readFileSync(file);
		var json = JSON.parse(data);
		return json;
	} catch(e) {
		return create_default_schema();
	}
};

var create_default_schema = function() {
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

var load_schema_file = function(path, name, callback) {
	try {
	var stats = fs.statSync(path);
	// if is_dir
	if (stats.isDirectory()) {
		callback(name, read_schema_file(path+"/"+"schema_config.json"));

		// Search for *-schema.json as well.
		var files = fs.readdirSync(path+"/");
		files.forEach(function(file) {
			// filter
			if (file.match(/-schema\.json$/i)) {
				var subname =file.replace(/-schema\.json$/i,"");
				callback(name+"/"+subname,
					read_schema_file(path+"/" + file
						+"/schema_config.json")
				);
			}
		});
	}
	// if is_file
	else if (stats.isFile()) {
		if (path.match(/\.(js|coffee)$/)) {
			callback(name, read_schema_file(
				path.replace(/\.(js|coffee)$/i, '') +
						"-schema.json"
			));
		}
	}
	} catch(e) {}
};

var load_schema_apps_in_dir = function(dir, cb_add_schema) {
	try {
	// read dir
	var files = fs.readdirSync(dir);
	// for files in dir
	files.forEach(function(file) {
		// filter
		if (file.match(/^er-app-/)) {
			load_schema_file(dir+file, file,
					function(name, sub_schema) {
				create_schema(name, sub_schema, cb_add_schema);
			});
		}
	});
	} catch(e) { }
};

var create_schema = function(name, sub_schema, cb_add_schema) {
	var name = name.replace(/\.(js|coffee)$/i, "");
	var short_name = name.replace(/^er-app-/, "");

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

	cb_add_schema(short_name, schema_a);
	console.log(short_name, sub_schema);

	return schema_a;
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

var load_schema_apps = function(app_dirs) {
	var schema_apps = [];
	var apps = {};
	app_dirs.forEach(function(app_dir) {
		if (app_dir == "") {
			app_dir = "./node_modules/"
		}
		load_schema_apps_in_dir(app_dir, function(name, a) {
			if (name.match(/test$/)) return;
			if (apps.hasOwnProperty(name))
				return;
			apps[name] = true;
			schema_apps.push(a);
		});
	});

	schema_apps.sort(function(a, b) {
		return a.title == b.title ? 0 : (
			a.title < b.title ? -1 : 1
		);
	});

	add_default_schema(schema_apps);

	return schema_apps;
};

exports.load_schema_apps = load_schema_apps;
