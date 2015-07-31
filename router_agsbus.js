var SerialPort = require("serialport").SerialPort;

var showbytes = function(str) {
	var hex = "";
	for(var i=0; i<str.length; i++) {
		//var str2 = str.substring(i,i+1);
		//var chr = str2.charCodeAt(0);
		var chr = str.charCodeAt(i);
		
		if ((chr < "A".charCodeAt(0) ||
				chr > "z".charCodeAt(0)) &&
				chr != 50 && chr != 58 &&
				chr != 0x23 && chr != 0x2c && chr != 0x2e) {
			//chr = chr.toString(16);
			//hex += " 0x" + (chr.length < 2 ? '0' + chr : chr)
			hex += " "+chr;
		} else {
			hex += " " + String.fromCharCode(chr);
		}
	}
	return hex;
};
var process_agsbus = function(router, basename, mcmd, margs) {
	if (mcmd == "Got") {
		//console.log("Got Activity");
		var result2 = margs.match(/^(.|\n|\r),(.|\n|\r),((?:.|\n|\r.){4})$/);
		if (result2) {
		var addr  = result2[1].charCodeAt(0);
		var cmd   = result2[2].charCodeAt(0);
		if (cmd == 228) {
			var time  = Date.now()/1000;
			for (var b=0;b<4;b++) {
				var state = result2[3].charCodeAt(b);
				//console.log("Got: " + addr + "@"
				//	+ cmd + " ["+state+"]");
			
				for (var j=0; j<8;j++) {
					var value = (state & (1 << (j))) && 1;
					var name = "/" + addr + "/" + ((b*8)+j);
					console.log(name + ": " + value);
					router.route_ifdiffer(basename + name, time, value);
					if (b==0) {
						router.register(basename + name + "_s", "agsbus", name, undefined, false);
					}
				}
			}
		}
		else {
			console.log("Unknown Command in got packet: ",
					cmd);
		}
		} else {
			console.log("Error: packet got, agsbus structure not recognized: ",
					showbytes(margs));
		}
	} else if (mcmd == "BMa") {
		console.log("BMa Activity");
	} else {
		console.log("Unknown Activity:", mcmd);
	}
};

exports.init = function(router, basename, command, args) {
	//var command = "../ethercat_bridge/main";
	//var args = "";

	//var SerialPort = require('../').SerialPort;
	var port = new SerialPort("/dev/ttyAMA0", {
		baudRate: 38400,
		dataBits: 8,
		parity: 'none',
		stopBits: 1
	});


	var buffer = ""; 
	port.on('data', function(data) {
		var str = data.toString('binary');
		//console.log("DATA: " + showbytes(str));
		buffer += str;
		//console.log("BUFFER: " + showbytes(buffer));
		//var agsbus_regex = /^(?:.|\n)*?#(.+?):((?:.|\n)+?)\.((?:.|\n)*)$/;
		var agsbus_regex = /^((?:.|\n|\r)*?)#(.+?):((?:.|\n|\r)+?)\.((?:.|\n|\r)*)$/;
		var result = buffer.match(agsbus_regex);
		while (result) {
			var b_pre = result[1];
			var mcmd = result[2];
			var margs = result[3];
			var b_post = result[4];

			if (b_pre.length != 0) {
				console.log("Nicht erkannt: " + showbytes(b_pre));
			}

			process_agsbus(router, basename, mcmd, margs);
			
			buffer = b_post;
			result = buffer.match(agsbus_regex);
		}
		//console.log("end -- search for Activties");
	});
	 
	port.on('error', function(err) {
		  console.log(err);
	});
	 
	port.on('open', function() {
		port.write("#BMa:GetState.");
	});

	router.dests.agsbus = function(id, time, value) {
		var addr = id.split("/");


		var cmd = 0xF1;
		var toggle = 0x00;
		var set = 0;
		var clear = 0;

		var bit = (addr[2]*1);
		value = value*1;
		if (value) {
			set = 1<<bit;
		} else {
			clear = 1<<bit;
		}
		var str = "#Put:" +
			String.fromCharCode(addr[1]*1) + "," +
			String.fromCharCode(cmd) + "," +
			String.fromCharCode(0,toggle,set,clear) + ".";

		console.log("COMMAND: ", showbytes(str));

		str = new Buffer(str, 'binary');
		port.write(str);
	};
};

