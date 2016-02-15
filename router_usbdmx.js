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

exports.init = function(router, basename, options, nodes) {
	var device = options.device;
	var port = new SerialPort(device, {
		baudRate: 115200,
		dataBits: 8,
		parity: 'none',
		stopBits: 1
	});

	port.write_bytes = function(data) {
		console.log("usbdmx: ", showbytes(data));
		this.write(new Buffer(data, 'binary'));
	}

	port.on('data', function(data) {
		var str = data.toString('binary');
		//console.log("DATA: " + showbytes(str));
	});
	 
	port.on('error', function(err) {
		  console.log(err);
	});

	port.set = function(channel, value) {
		channel--;
		var cmd = (channel >> 8);
		cmd += 0x48;
		channel &= 0xFF;
		value &= 0xFF;
		port.write_bytes(String.fromCharCode(cmd, channel, value));
	};

	router.dests.usbdmx = function(node) {
		var channel = this.id;
		port.set(channel, node.value);

		var dnode = node.name.replace(/_s$|@s$/, "");
		router.node(dnode).publish(node.time, node.value);
	};

	 
	port.on('open', function() {
		port.write_bytes(String.fromCharCode(0x22));

		for (var n in nodes) {
			var channel = nodes[n];

			router.node(basename + n + '_s').register('usbdmx', channel);
		}
	});
};
