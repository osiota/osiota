/*
 * modul: virtual devices
 */

var fs = require('fs');

exports.init = function(node, app_config, main, host_info) {
	// config:
	var filename = "external.csv";
	if (typeof app_config.filename === "string") {
		filename = app_config.filename;
	}
	var interval = 1;
	if (typeof app_config.interval === "string") {
		interval = app_config.interval;
	}
	var repeats = null;
	if (typeof app_config.repeats === "number") {
		repeats = app_config.repeats;
	}
	var metadata = {
		"type": "energy.data"
	};
	if (typeof app_config.metadata === "object") {
		metadata = app_config.metadata;
	}

	node.announce(metadata);

	var tid = null;

	// read file=> data
	fs.readFile(filename, function(err, data) {
		if (err) throw err;

		// read contents:
		var energy = data.toString().split(/\n/);
		// remove last empty line
		if (energy[energy.length-1] == "")
			energy.pop();

		// convert to integer:
		for(var i=0; i<energy.length;i++) {
			energy[i] = energy[i].replace(/^.*[\t,]/, "");
			energy[i] = +energy[i];
		}

		var energy_i = 0;
		tid = setInterval(function() {
			energy_i++;
			// at end of data?
			if (energy_i >= energy.length) {
				energy_i = 0;
				// repeats:
				if (repeats !== null) {
					repeats--;
					if (repeats <= 0) {
						clearInterval(tid);
						tid = null;
						return;
					}
				}
			}
			var value = energy[energy_i];

			// publish:
			var time = new Date() / 1000;
			node.publish(time, value);
		}, 1000 * interval);
	});

	return [node, function(unload) {
		if (tid) {
			unload(tid);
			tid = null
		}
	}];
};

