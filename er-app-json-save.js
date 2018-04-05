const fs = require("fs");
const path = require("path");
const mkdirp = require('mkdirp');

exports.init = function(node, app_config, main, host_info) {
	if (typeof app_config.filename !== "string") {
		throw new Error("config option json filename not defined.");
	}

	var config_save_last = false;
	if (typeof app_config.save_last !== "undefined") {
		config_save_last = app_config.save_last;
	}
	var config_save_only_last = false;
	if (typeof app_config.save_only_last !== "undefined") {
		config_save_only_last = app_config.save_only_last;
	}
	var config_save_no_data = false;
	if (typeof app_config.save_no_data !== "undefined") {
		config_save_no_data = app_config.save_no_data;
	}

	var object = {};
	var data = [];
	var last_data = null;

	var source = this._source;

	source.ready("announce", function() {
		object.metadata = source.metadata;
		object.name = source.name;
	});

	var s = null;
	if (!config_save_no_data) {
	this._source.subscribe(function(do_not_add_to_history, initial){
		if (initial)
			return;
		if (do_not_add_to_history) {
			if (this.time !== null) {
				last_data = {
					"time": this.time,
					"value": this.value
				};
				//console.log("ADD LAST DATA", last_data);
			}
			return;
		}
		last_data = null;

		data.push({
			"time": this.time,
			"value": this.value
		});

	});
	}

	return [function(unload) {
		if (main.user_terminated) {
			unload(s);
			return;
		}
		setTimeout(function() {
		console.log("Write json file");

		data.sort(function (a, b) {
			if (a.time < b.time)
				return -1;
			if (a.time > b.time)
				return 1;
			return 0;
		});
		if (config_save_last && last_data !== null) {
			data.push(last_data);
		}
		var full_history = !config_save_no_data;
		if (config_save_only_last) {
			data = [ data[data.length-1] ];
			full_history = false;
		}
		if (typeof object.metadata === "object" &&
				object.metadata !== null) {
			object.metadata.full_history = full_history;
		}
		object.data = data;
		var f_N = "node";
		if (typeof object.name === "string")
			f_N = object.name.replace(/^\//, "");
		var f_n = f_N.replace(/\/+/g, "-");
		var filename = app_config.filename
			.replace(/%n/, f_n)
			.replace(/%N/, f_N);
		mkdirp(path.dirname(filename), function(err) {
			if (err) throw err;
			fs.writeFile(filename,
					JSON.stringify(object, null, "\t"),
					function(err) {
				if (err) throw err;
				console.log("json file written.");

				unload(s);
			});
		});
		data = [];

		}, 100);
	}];
};
