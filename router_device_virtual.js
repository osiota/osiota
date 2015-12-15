/*
 * modul: virtual devices
 */

var fs = require('fs');

exports.play_device = function(nodename, c) {
	var _r = this;
	// config:
	var filename = c.filename || "external.csv";
	var interval = c.interval || 1;
	var repeats = c.repeats || null;

	// read file=> data
	fs.readFile(filename, function(err, data) {
		if (err) throw err;

		// read contents:
		var energy = data.toString().split(/\n/);
		// convert to integer:
		for(var i=0; i<energy.length;i++) energy[i] = +energy[i];
		
		var energy_i = 0;
		var si = setInterval(function() {
			energy_i++;
			// at end of data?
			if (energy_i >= energy.length) {
				energy_i = 0;
				// repeats:
				if (repeats !== null) {
					repeats--;
					if (repeats <= 0) {
						clearInterval(si);
						return;
					}
				}
			}
			var value = energy[energy_i];

			// publish:
			var time = new Date() / 1000;
			_r.publish(nodename, time, value);
		}, 1000 * interval);
	});
}

exports.init = function(router, config) {
	router.play_device = exports.play_device;
	for (var n in config) {
		router.play_device(n, config[n]);
	}
};


