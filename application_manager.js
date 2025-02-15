const fs = require("fs");
const path = require('path');
const Ajv = require('ajv');

const json_validate = require("./helper_json_validate.js").json_validate;

const schema_cache = {};
let __found_apps = null;

/**
 * Application Manager class
 */
class application_manager {
	/**
	 * Creates an application manager
	 * @param {main} main - Main instance
	 */
	constructor(main) {
		this._app_schema = null;
		this._schema = null;
		this._main = main;

		/*
		const app = this.find_app({
			"app_type": "parser",
			"file_ext": "hallo.json"
		});
		console.log("found app:", app);
		*/
	};

	/**
	 * Find application by metadata
	 * @param {object} metadata - Meta data
	 * @returns {string} Application name
	 */
	find_app(metadata) {
		if (!Array.isArray(metadata)) {
			metadata = [ metadata ];
		}
		let app_max_prio = 0;
		let app = null;
		this.app_schema().forEach(function(app_schema) {
			if (typeof app_schema.properties== "object" &&
					typeof app_schema.properties.config
						== "object" &&
					typeof app_schema.properties.config.app_metadata
						== "object") {
				const schema = app_schema.properties.config.app_metadata;
				let prio = 100;
				if (typeof schema.prio === "number") {
					prio = schema.prio;
				}
				metadata.forEach(function(m) {
					const valid = json_validate(schema, m);
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
	app_schema() {
		// WARNING: This function is SYNCHRON:
		if (this._app_schema === null) {
			this._app_schema = this.load_schema_apps();
		}
		return this._app_schema;
	};

	/**
	 * Get full schema
	 * @returns {object} The JSON schema
	 */
	schema() {
		if (this._schema !== null) {
			return this._schema;
		}
		const schema = require("./schema_config.json");
		console.log("Checking schemas:");
		const app_schema = this.app_schema().filter(function(a) {
			try {
				console.log("App", a.properties.name.enum[0]);
				const test_ajv = new Ajv({strict: "log"});
				test_ajv.addSchema(Object.values(require("./schemas/all-map.json")));
				test_ajv.addKeyword("app_metadata");
				test_ajv.addKeyword("headerTemplate");
				test_ajv.addKeyword("options");
				const s = {
					"type": "object",
					"properties": {
						"app": {
							"type": "array",
							"items": {
								"oneOf": [a]
							}
						}
					},
					"definitions": schema.definitions
				};
				const compiled = test_ajv.compile(s);
				return true;
			} catch(e) {
				console.warn("App schema of", a.properties.name.enum[0], "is invalid:", e.message);
				return false;
			}
		});
		console.log("End checking schemas.");
		schema.properties.app.items.oneOf = app_schema;

		// config
		//require('fs').writeFileSync("test_output_schema.json", JSON.stringify(schema, undefined, "\t"));
		this._schema = schema;
		return schema;
	};

	/**
	 * Check config object
	 * @param {object} config - Config object
	 * @returns {boolean} config valid
	 */
	check_config(config) {
		const schema = this.schema();

		const ajv = new Ajv({strict: "log"});
		ajv.addSchema(Object.values(require("./schemas/all-map.json")));
		ajv.addKeyword("app_metadata");
		ajv.addKeyword("headerTemplate");
		ajv.addKeyword("options");
		let validate;
		try {
			validate = ajv.compile(schema);
		if (!validate(config)) {
			return validate.errors.filter(function(e) {
				return e.keyword !== 'enum' ||
					!e.dataPath.match(/^\.app.*\.name$/) ||
					e.message !== 'should be equal to one of the allowed values';
			});
		}
		} catch(e) {
			console.error("Schema Compile", e);
			process.exit(1);
		}
		return null;
	}

	/**
	 * Get schema for app
	 * @param {string} app - Application name
	 * @returns {object} The JSON schema
	 */
	get_schema(app) {
		const _this = this;

		if (typeof app !== "string")
			throw new Error("admin-app: app needs to be string");
		app = app.replace(/^(er|osiota)-app-/, "");

		if (schema_cache.hasOwnProperty(app)) {
			return schema_cache[app];
		}
		let schema = null;
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
		schema_cache[app] = schema;
		return schema;
	};

	read_schema_file(file, app) {
		if (schema_cache.hasOwnProperty(app)) {
			return schema_cache[app];
		}

		let schema;
		try {
			const data = fs.readFileSync(file);
			schema = JSON.parse(data);
		} catch(e) {
			schema = this.create_default_schema();
		}
		schema_cache[app] = schema;
		return schema;
	};

	create_default_schema() {
		return {
			"type": "object",
			"title": "Settings",
			"additionalProperties": true
		};
	}

	load_schema_file(path, name, callback) {
		const _this = this;
		try {
		const stats = fs.statSync(path);
		// if is_dir
		if (stats.isDirectory()) {
			//TODO: rename schema_config to schema
			let schema_path = path + "/schema.json";
			callback({
				name,
				sub_schema: this.read_schema_file(schema_path, name),
				schema_path,
				path,
				dir_path: path+"/",
			});

			// Search for *-schema.json as well.
			const files = fs.readdirSync(path+"/");
			files.forEach(function(file) {
				if (file.match(/^\./)) return;
				// filter
				if (file.match(/-schema\.json$/i)) {
					const subname =file.replace(/-schema\.json$/i,"");
					let schema_path = path+"/"+file;
					callback({
						name: name+"/"+subname,
						sub_schema: _this.read_schema_file(schema_path, name+"/"+subname),
						schema_path,
						path: path+"/"+subname,
						dir_path: path+"/",
					});
				}
			});
		}
		// if is_file
		else if (stats.isFile()) {
			if (path.match(/\.(js|coffee)$/i)) {
				let sub_path = path.replace(/\.(js|coffee)$/i, '');
				let schema_path = sub_path + "-schema.json";
				callback({
					name,
					sub_schema: this.read_schema_file(
						schema_path,
						name
					),
					schema_path,
					path: sub_path,
					dir_path: path.replace(/[^\/]*$/, ""),
				});
			}
		}
		} catch(e) {
			console.warn("Warning while reading app schema:", e);
		}
	};

	load_schema_apps_in_dir(dir, cb_add_schema) {
		const _this = this;
		try {
		// read dir
		const files = fs.readdirSync(dir);
		// for files in dir
		files.forEach(function(file) {
			// filter
			if (file.match(/^(er|osiota)-app-/)) {
				_this.load_schema_file(dir+file, file,
						function(info) {
					_this.create_schema(info,
						cb_add_schema);
				});
			}
		});
		} catch(e) { }
	};

	create_schema(info, cb_add_schema) {
		let name = info.name;
		const sub_schema = info.sub_schema;
		name = name.replace(/\.(js|coffee)$/i, "");
		const short_name = name.replace(/^(er|osiota)-app-/, "");

		sub_schema.title = "Settings";
		if (typeof sub_schema.properties === "object") {
			sub_schema.properties.app = {
				"$ref":"#/properties/app"
			};
		}

		const schema_a = {
			"type": "object",
			"title": short_name,
			"properties": {
				"name": {
					"type": "string",
					"enum": [
						short_name,
						name
					]
				 },
				"config": sub_schema,
				"deactive": {
					"type": "boolean"
				}
			},
			"required": [ "name" ],
			"additionalProperties": false
		};

		cb_add_schema(short_name, {
			...info,
			"name": short_name,
			"schema": schema_a
		});

		return schema_a;
	};

	load_schema_apps() {
		const _this = this;

		const apps = this.search_apps();

		const schema_apps = [];
		Object.keys(apps).forEach(function(name) {
			const a = apps[name].schema;
			if (name.match(/test$/)) return;
			schema_apps.push(a);
		});

		schema_apps.sort(function(a, b) {
			return a.title == b.title ? 0 : (
				a.title < b.title ? -1 : 1
			);
		});

		return schema_apps;
	};

	/**
	 * List all applications
	 *
	 * @returns {Array<string>} Array with application names.
	 */
	list_applications() {
		const apps = this.search_apps();

		return Object.keys(apps);
	};
	get_absolute_paths(pathsArray) {
		const absolutePaths = new Set();

		pathsArray.forEach((p)=>{
			if (p == "") {
				p = "./node_modules/";
			}
			const absolutePath = path.resolve(p)+"/";
			absolutePaths.add(absolutePath);
		});

		return Array.from(absolutePaths);
	};
	search_apps() {
		const _this = this;

		// caching:
		if (__found_apps) return __found_apps;

		const apps = {};
		const dirs = this.get_absolute_paths(this._main.app_dirs);
		dirs.forEach(function(app_dir) {
			_this.load_schema_apps_in_dir(app_dir, function(name, info) {
				//TODO
				//if (name.match(/test$/)) return;
				if (apps.hasOwnProperty(name))
					return;
				apps[name] = info;
			});
		});

		__found_apps = apps;

		return apps;
	};
};
exports.application_manager = application_manager;

