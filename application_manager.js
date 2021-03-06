const fs = require("fs");
const Ajv = require('ajv');

/**
 * Application Manager class
 * @class
 * @classdesc Application Manager class
 * @name application_manager
 * @param {main} main - Main instance
 */
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

/**
 * Find application by metadata
 * @param {object} metadata - Meta data
 * @returns {string} Application name
 */
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
					app_max_prio = prio;
					app = app_schema;
				}
			});
		}
	});
	if (!app) return null;
	return app.title;
};

/**
 * Load schema of all apps
 * @returns {object} The JSON schema
 */
exports.application_manager.prototype.schema = function() {
	// WARNING: This function is SYNCHRON:
	if (this._schema === null) {
		this._schema = this.load_schema_apps();
	}
	return this._schema;
};

var schema_cache = {};
/**
 * Get schema for app
 * @param {string} app - Application name
 * @returns {object} The JSON schema
 */
exports.application_manager.prototype.get_schema = function(app) {
	var _this = this;

	if (typeof app !== "string")
		throw new Error("admin-app: app needs to be string");
	app = app.replace(/^(er|osiota)-app-/, "");

	if (schema_cache.hasOwnProperty(app)) {
		return schema_cache[app];
	}
	var schema = null;
	try {
		this._main.require([
			"osiota-app-" + app + "-schema.json",
			"er-app-" + app + "-schema.json",
			"osiota-app-" + app + "/schema.json",
			"er-app-" + app + "/schema.json",
			"osiota-app-" + app + "/schema-config.json",
			"er-app-" + app + "/schema-config.json"
		], function(contents) {
			schema = contents;
		});
	} catch(err) {
		console.warn("Error loading schema:", err);
	}

	if (!schema) {
		schema = this.create_default_schema();
	}
	// defaults:
	if (typeof schema.type === "undefined") {
		schema.type = "object";
	}
	if (typeof schema.additionalProperties === "undefined") {
		schema.additionalProperties = false;
	}
	if (typeof schema.title === "undefined") {
		schema.title = "Settings";
	}
	if (typeof schema.properties === "undefined" &&
			schema.additionalProperties === false &&
			typeof schema.options === "undefined") {
		schema.options = { "hidden": true };
	}
	if (typeof schema.properties === "object" &&
			schema.properties !== null &&
			schema.additionalProperties === false &&
			typeof schema.options === "undefined" &&
			Object.keys(schema.properties).length === 0) {
		schema.options = { "hidden": true };
	}

	schema_cache[app] = schema;
	return schema;
};

exports.application_manager.prototype.read_schema_file_simple = function(file) {
	var data = fs.readFileSync(file);
	var json = JSON.parse(data);
	return json;
};

exports.application_manager.prototype.read_schema_file = function(file, app) {
	if (schema_cache.hasOwnProperty(app)) {
		return schema_cache[app];
	}

	var schema;
	try {
		var data = fs.readFileSync(file);
		schema = JSON.parse(data);
	} catch(e) {
		schema = this.create_default_schema();
	}
	schema_cache[app] = schema;
	return schema;
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
		//TODO: rename schema_config to schema
		callback(name, this.read_schema_file(path+"/"+
					"schema_config.json", name), path);

		// Search for *-schema.json as well.
		var files = fs.readdirSync(path+"/");
		files.forEach(function(file) {
			// filter
			if (file.match(/-schema\.json$/i)) {
				var subname =file.replace(/-schema\.json$/i,"");
				callback(name+"/"+subname,
					_this.read_schema_file(path+"/" + file
						+"/schema_config.json",
						name+"/"+subname),
					path+"/"+file
				);
			}
		});
	}
	// if is_file
	else if (stats.isFile()) {
		if (path.match(/\.(js|coffee)$/i)) {
			callback(name,
				this.read_schema_file(
					path.replace(/\.(js|coffee)$/i, '') +
						"-schema.json",
					name
				),
				path.replace(/\.(js|coffee)$/i, '')
			);
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
		if (file.match(/^(er|osiota)-app-/)) {
			_this.load_schema_file(dir+file, file,
					function(name, sub_schema, path) {
				_this.create_schema(name, sub_schema, path,
					cb_add_schema);
			});
		}
	});
	} catch(e) { }
};

exports.application_manager.prototype.create_schema = function(name,
					sub_schema, path, cb_add_schema) {
	var name = name.replace(/\.(js|coffee)$/i, "");
	var short_name = name.replace(/^(er|osiota)-app-/, "");

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

	cb_add_schema(short_name, path, schema_a);
	//console.log("added schema:", short_name, path, sub_schema);

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

exports.application_manager.prototype.load_schema_apps = function() {
	var _this = this;

	var apps = this.search_apps();

	var schema_apps = [];
	Object.keys(apps).forEach(function(name) {
		var a = apps[name].schema;
		if (name.match(/test$/)) return;
		schema_apps.push(a);
	});

	schema_apps.sort(function(a, b) {
		return a.title == b.title ? 0 : (
			a.title < b.title ? -1 : 1
		);
	});

	this.add_default_schema(schema_apps);

	return schema_apps;
};

/**
 * List all applications
 *
 * @returns {Array<string>} Array with application names.
 */
exports.application_manager.prototype.list_applications = function() {
	var apps = this.search_apps();

	return Object.keys(apps);
};

var __found_apps = null;
exports.application_manager.prototype.search_apps = function() {
	var _this = this;

	// caching:
	if (__found_apps) return __found_apps;

	var apps = {};
	this._main.app_dirs.forEach(function(app_dir) {
		if (app_dir == "") {
			app_dir = "./node_modules/"
		}
		_this.load_schema_apps_in_dir(app_dir, function(name, path, a) {
			//TODO
			//if (name.match(/test$/)) return;
			if (apps.hasOwnProperty(name))
				return;
			apps[name] = {
				"path": path,
				"schema": a
			};
		});
	});

	__found_apps = apps;

	return apps;
};


var default_types = {
	"er-filter": {
		"type": "object",
		"title": "Node filter options",
		"properties": {
			"metadata": {
				"type": "object",
				"title": "Meta data to filter",
				"additionalProperties": true,
				"options": {
					"disable_properties": false,
					"disable_edit_json": false
				}
			},
			"nodes": {
				"type": "array",
				"title": "List of nodes permitted",
				"items": {
					"type": "string"
				}
			},
			"depth": {
				"type": "number",
				"title": "Node depth permitted"
			}
		}
	}
};
exports.application_manager.prototype.schema_default_types = function(schema) {
	if (typeof schema !== "object") {
		return schema;
	}
	if (Array.isArray(schema)) {
		for (var k=0; k<schema.length; k++) {
			schema[k] = this.schema_default_types(schema[k]);
		}

		return schema;
	}
	if (typeof schema.type === "string" &&
			typeof default_types[schema.type] === "object") {
		schema = default_types[schema.type];
	}

	for (var key in schema) {
		if (schema.hasOwnProperty(key)) {
			schema[key] = this.schema_default_types(schema[key]);
		}
	}

	return schema;
};
