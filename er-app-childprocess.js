/*
 * This module starts a child process to collect or send data to other processes via stdin and stdout.
 * The data format is decribed in the documentation.
 */

var subapp = {};
subapp.init = function(node, app_config, main, host_info) {
	node.announce({
		"type": "energy.data"
	});
	this._source.subscribe(function() {
		node.publish(this.time, this.value);
	});
	var _this = this;
	node.rpc_set = function(reply, value) {
		_this._source.rpc_set(reply, value);
	};
	return node;
};

exports.init = function(node, app_config, main, host_info) {
	var command = app_config.command;
	var args = app_config.args;

	var map = node.map(app_config.map,
			app_config.map_app || subapp);

	// initialize the child process:
	var spawn = require('child_process').spawn;
	var childProcess = spawn(command, args);
	childProcess.stdin.setEncoding('utf8');
	childProcess.stdout.setEncoding('utf8');
	childProcess.stderr.setEncoding('utf8');

	childProcess.stdout.on("data", function (data) {
		//console.error("LOG "+data.toString());
		var str = data.toString();
		var lines = str.split(/\r?\n/g);
		for (var i=0; i<lines.length; i++) {
			if (lines[i] != "") {
				//console.log("LOG "+lines[i]);
				var result = lines[i].match(/^([^\[]+)\s+\[([0-9.]+)\]:\s+([-0-9.]+)$/);
				if (result) {
					var name = result[1];
					var time = 1 * result[2];
					var value = 1 * result[3];
					if (result[3] == "null")
						value = null;

					var n = map.node(name);
					n.publish(time, value);
				} else {
					// connect:
					var result = lines[i].match(/^connect\s+([^\[]+)\s*$/);
					if (result) {
						let name = result[1];
						// TODO: remove:
						name.replace(/_s$/, "");

						var n = map.node(name);
						n.rpc_set = function(reply, value) {
							childProcess.stdin.write(name + " [" + new Date()/1000 + "]:\t" + value + "\n");
							
						};
					}
				}
			}
		}
	});

	childProcess.stderr.on("data", function (data) {
		console.error(data.toString().replace(/(\n|\r)+$/, ''));
		//console.error("Error in child_process: "+data.toString() +"\n"
		//	+ "Command: " + command + " " + args);
	});
	var _this = this;
	/*process.on('exit', function () {
		_this._unload();
	});*/
	return [map, function() {
		childProcess.kill();
	}];
};

