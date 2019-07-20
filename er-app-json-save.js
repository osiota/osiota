const fs = require("fs");
const path = require("path");
const mkdirp = require('mkdirp');

exports.init = function(node, app_config, main, host_info) {
	var _this = this;

	if (typeof app_config.filename !== "string") {
		throw new Error("config option json filename not defined.");
	}

	this.config_filename = app_config.filename;

	this.config_save_last = false;
	if (typeof app_config.save_last !== "undefined") {
		this.config_save_last = app_config.save_last;
	}
	this.config_save_only_last = false;
	if (typeof app_config.save_only_last !== "undefined") {
		this.config_save_only_last = app_config.save_only_last;
	}
	this.config_save_no_data = false;
	if (typeof app_config.save_no_data !== "undefined") {
		this.config_save_no_data = app_config.save_no_data;
	}

	this.object = {};
	this.data = [];
	this.last_data = null;

	this._source.ready("announce", function() {
		_this.object.metadata = _this._source.metadata;
		_this.object.name = _this._source.name;
	});

	var s = null;
	if (!this.config_save_no_data) {
	this._source.subscribe(function(do_not_add_to_history, initial){
		if (initial)
			return;
		if (do_not_add_to_history) {
			if (this.time !== null) {
				_this.last_data = {
					"time": this.time,
					"value": this.value
				};
				//console.log("ADD LAST DATA", last_data);
			}
			return;
		}
		_this.last_data = null;

		_this.data.push({
			"time": this.time,
			"value": this.value
		});

	});
	}

	return [s];
};
exports.unload = function(co, unload_object) {
	var _this = this;

	if (this._main.user_terminated) {
		unload_object(co);
		return;
	}
	// wait 100ms till all other apps are finished:
	setTimeout(function() {
		console.log("Write file");

		// sort and add data:
		_this.data.sort(function (a, b) {
			if (a.time < b.time)
				return -1;
			if (a.time > b.time)
				return 1;
			return 0;
		});
		if (_this.config_save_last && last_data !== null) {
			_this.data.push(_this.last_data);
		}
		var full_history = !_this.config_save_no_data;
		if (_this.config_save_only_last && _this.data.length) {
			_this.data = [ _this.data[_this.data.length-1] ];
			full_history = false;
		}

		// fill object:
		if (typeof _this.object.metadata === "object" &&
				_this.object.metadata !== null) {
			_this.object.metadata.full_history = full_history;
		}
		_this.object.data = _this.data;

		// create filename:
		var f_N = "node";
		if (typeof _this.object.name === "string")
			f_N = _this.object.name.replace(/^\//, "");
		var f_n = f_N.replace(/\/+/g, "-");
		var filename = _this.config_filename
			.replace(/%n/, f_n)
			.replace(/%N/, f_N);

		var write_options = {};
		if (_this._config.append) {
			write_options.flag = "a";
		}

		// create parent directory and file:
		mkdirp(path.dirname(filename), function(err) {
			if (err) throw err;
			fs.writeFile(filename, _this.format_file(_this.object),
					write_options,
					function(err) {
				if (err) throw err;
				console.log("output file written.");

				// clear data:
				_this.data = [];
				_this.object = {};

				// clear other objects:
				unload_object(co);
			});
		});
	}, 100);
};

exports.format_file = function(object) {
	return JSON.stringify(object, null, "\t");
};
