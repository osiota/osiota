/* USB-DMX protocol:
 * http://usbdmx.com/downloads/protocol.pdf
 */

var SerialPort = require("serialport").SerialPort;

var showbytes = function(str) {
	var hex = "";
	for(var i=0; i<str.length; i++) {
		var chr = str.charCodeAt(i);
		hex += " " + chr;
	}
	return hex;
};

exports.init = function(node, app_config, main, host_info) {
	console.log(app_config);
	if (typeof app_config !== "object") {
		app_config = {};
	}
	if (typeof app_config.nodes !== "object") {
		app_config.nodes = {};
	}
	if (typeof app_config.device !== "string") {
		app_config.device ='/dev/cu.wchusbserial640';
	}

	var port = new SerialPort(app_config.device, {
		baudRate: 115200,
		dataBits: 8,
		parity: 'none',
		stopBits: 1
	});

	port.write_bytes = function(data) {
		//console.log("usbdmx: ", showbytes(data));
		this.write(new Buffer(data, 'binary'));
	}

	port.on('data', function(data) {
		var str = data.toString('binary');
		//console.log("DATA: " + showbytes(str));
	});
	 
	port.on('error', function(err) {
		  console.log(err);
	});

	port.init = function() {
		port.write_bytes(String.fromCharCode(0x22));
	};
	port.set = function(channel, value) {
		channel--;
		var cmd = (channel >> 8);
		cmd += 0x48;
		channel &= 0xFF;
		value &= 0xFF;
		port.write_bytes(String.fromCharCode(cmd, channel, value));
	};

	port.on('open', function() {
		port.init();

	// set loop (see artnet)
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

			port.set(channel, value);
			this.publish(undefined, value);

			reply(null, "ok");
		};
		})(nn, channel, default_value);

		if (default_value !== null) {
			nn.rpc_set(function() {}, default_value);
		}
	}
	// end set loop
	});
};

