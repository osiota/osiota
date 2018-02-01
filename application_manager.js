const fs = require("fs");
const Ajv = require('ajv');

exports.application_manager = function(main) {
	this._schema = null;
	this._main = main;

	/*
	var app = this.find_app({
		"app_type": "parser",
		"file_ext": "hallo.json"
	});
	console.log("found app:", app);
	*/
};

var json_validate = function(schema, data) {
	if (!schema.__compiled) {
		var ajv = new Ajv({allErrors: true});
		schema.__compiled = ajv.compile(schema);
		Object.defineProperty(schema, '__compiled',{enumerable: false});
	}
	return schema.__compiled(data);
}

exports.application_manager.prototype.find_app = function(metadata) {
	if (!Array.isArray(metadata)) {
		metadata = [ metadata ];
	}
	var app_max_prio = 0;
	var app = null;
	this.schema().forEach(function(app_schema) {
		if (typeof app_schema.properties== "object" &&
				typeof app_schema.properties.config
					== "object" &&
				typeof app_schema.properties.config.app_metadata
					== "object") {
			var schema = app_schema.properties.config.app_metadata;
			var prio = 100;
			if (typeof schema.prio === "number") {
				prio = schema.prio;
			}
			metadata.forEach(function(m) {
				var valid = json_validate(schema, m);
				if (valid && prio > app_max_prio) {
					console.log("match", prio);
					app_max_prio = prio;
					app = app_schema;
				}
			});
				
		}
	});
	if (!app) return null;
	return app.title;
};

/* SCHEMA */
exports.application_manager.prototype.schema = function() {
	// WARNING: This function is SYNCHRON:
	if (this._schema === null) {
		this._schema = this.load_schema_apps(this._main.app_dirs);
	}
	return this._schema;
};
exports.application_manager.prototype.read_schema_file = function(file) {
	try {
		var data = fs.readFileSync(file);
		var json = JSON.parse(data);
		return json;
	} catch(e) {
		return this.create_default_schema();
	}
};

exports.application_manager.prototype.create_default_schema = function() {
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

exports.application_manager.prototype.load_schema_file = function(path, name, callback) {
	var _this = this;
	try {
	var stats = fs.statSync(path);
	// if is_dir
	if (stats.isDirectory()) {
		callback(name, this.read_schema_file(path+"/"+
					"schema_config.json"));

		// Search for *-schema.json as well.
		var files = fs.readdirSync(path+"/");
		files.forEach(function(file) {
			// filter
			if (file.match(/-schema\.json$/i)) {
				var subname =file.replace(/-schema\.json$/i,"");
				callback(name+"/"+subname,
					_this.read_schema_file(path+"/" + file
						+"/schema_config.json")
				);
			}
		});
	}
	// if is_file
	else if (stats.isFile()) {
		if (path.match(/\.(js|coffee)$/)) {
			callback(name, this.read_schema_file(
				path.replace(/\.(js|coffee)$/i, '') +
						"-schema.json"
			));
		}
	}
	} catch(e) {}
};

exports.application_manager.prototype.load_schema_apps_in_dir = function(dir,
						cb_add_schema) {
	var _this = this;
	try {
	// read dir
	var files = fs.readdirSync(dir);
	// for files in dir
	files.forEach(function(file) {
		// filter
		if (file.match(/^er-app-/)) {
			_this.load_schema_file(dir+file, file,
					function(name, sub_schema) {
				_this.create_schema(name, sub_schema,
					cb_add_schema);
			});
		}
	});
	} catch(e) { }
};

exports.application_manager.prototype.create_schema = function(name,
					sub_schema, cb_add_schema) {
	var name = name.replace(/\.(js|coffee)$/i, "");
	var short_name = name.replace(/^er-app-/, "");

	sub_schema.title = "Settings";
	if (typeof sub_schema.properties === "object") {
		sub_schema.properties.app = {
			"$ref":"#/properties/app"
		};
	}

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

exports.application_manager.prototype.add_default_schema = function(schema) {
	var sub_schema = this.create_default_schema();
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

exports.application_manager.prototype.load_schema_apps = function(app_dirs) {
	var _this = this;

	var schema_apps = [];
	var apps = {};
	app_dirs.forEach(function(app_dir) {
		if (app_dir == "") {
			app_dir = "./node_modules/"
		}
		_this.load_schema_apps_in_dir(app_dir, function(name, a) {
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

	this.add_default_schema(schema_apps);

	return schema_apps;
};
