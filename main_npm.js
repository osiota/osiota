
var npm = require('npm');
if (npm) {
	npm.command = function(command) {
	    var args = Array.prototype.slice.call(arguments);
        // var command = 
        args.shift();
        var callback = 
        args.pop();

		this.load(function(err, npm) {
            if (err) throw new Error("npm load error: " + JSON.stringify(err));
			if (!this.commands.hasOwnProperty(command))
				throw new Error("npm command not found");

			console.log("run: npm ", command, args);

            args.push(function(err, data, lite) {
				if (err) throw new Error("npm error: " + JSON.stringify(err));
				if (typeof callback === "function") {
					callback(data, lite);
				}
            });

			this.commands[command].apply(this.commands, args);
		});
	}
};


var main = require("./main");

main.prototype.install = function(app, callback) {
	app = app.replace(/^er-app-/, "");
	npm.command("install", ["git+https://gitlab.ibr.cs.tu-bs.de/y0071219/tubs-iot-" + app + ".git"], function() {
		if (typeof callback === "function")
			callback();
	});
};

main.prototype.get_allapps = function(callback) {
	npm.command("ls", [], true, function(data, lite) {
		var library_names = [];
		var regexp = new RegExp("^er-app-");
		Object.keys(lite.dependencies).sort().forEach(function(name) {
			if(name.match(regexp)) {
				library_names.push(name);
			}
		});
		callback(library_names);
	});
};

main.prototype.startup_all = function(type, host_info) {
	var _this = this;
	this.get_allapps(function(library_names) {
		library_names.forEach(function(name) {
			_this.startup(name, type, host_info)
		});
	});
};

main.prototype.require_npm_install = function(app, app_config, host_info, auto_install) {
	var _this = this;
	try {
		var m = this.require_1(app);
		return m;
	} catch(error) {
		if (auto_install && error.code == 'MODULE_NOT_FOUND') {
			_this.install(app, function() {
				_this.startup(app, app_config, host_info, false);
			});
			throw new Error("Module will be installed automatically: " + app);
		}
		throw error;
	}
};
main.prototype.require = main.prototype.require_npm_install;

module.exports = main;

