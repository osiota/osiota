/*
 * TODO:
 * modul artnet aendern:
 *
 * that.send(universe, 512, callback);
 */

exports.init = function(node, app_config, main, host_info) {
	if (typeof app_config.options !== "object") {
		app_config.options = {
			"host": "127.0.0.1",
			"sendAll": true
		};
	}
	if (typeof app_config.object !== "object") {
		app_config.object = {
		};
	}

	var universe = 0;
	if (typeof app_config.universe === "number") {
		universe = app_config.universe;
	}

	var artnet = require('artnet')(app_config.options);

	node.rpc_dmx = function(reply, channel, value) {
		if (value === null)
			value = 0;
		if (typeof value !== "number")
			value *= 1;

		artnet.set(universe, channel, value);

		reply(null, "ok");
	};
	node.dmx = function(channel, value) {
		if (value === null)
			value = 0;
		if (typeof value !== "number")
			value *= 1;

		artnet.set(universe, channel, value);
	};

	node.announce({
		"type": "artnet.rpc"
	});

	// set loop (see usbdmx)
	for (var n in app_config.nodes) {
		var channel = app_config.nodes[n];
		var default_value = null;
		var nn = node.node(n);

		if (Array.isArray(channel)) {
			if (channel.length >= 2) {
				default_value = channel[1];
			}
			channel = channel[0];
		}

		if (typeof channel === "object" &&
				typeof channel.channel === "number" &&
				typeof channel.value === "number") {
			default_value = channel.value;   
			channel = channel.channel;              
		}

		(function(nn, channel, default_value) {
		nn.rpc_set = function(reply, value) {
			if (value === null)
				value = default_value;
			if (typeof value !== "number")
				value *= 1;

			artnet.set(universe, channel, value);
			this.publish(undefined, value);

			reply(null, "ok");
		};
		})(nn, channel, default_value);

		if (default_value !== null) {
			nn.rpc_set(function() {}, default_value);
		}
	}
	// end set loop

	return [node, artnet];
};

