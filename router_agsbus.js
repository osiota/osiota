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

var read_bits = function(router, basename, name_extra, offset, payload) {
	var state = payload.charCodeAt(0);
	var time  = Date.now()/1000;
			
	for (var j=0; j<8;j++) {
		var value = (state & (1 << (j))) && 1;
		var name = "/" + (offset+j) + name_extra;
		//console.log(name + ": " + value);
		router.route(basename + name, time, value, 1);
	}
};
var convert_to_int16 = function(payload, offset) {
	var byte_hi = payload.charCodeAt(offset);
	var byte_lo = payload.charCodeAt(offset+1);

	var value = (byte_hi<<8) + byte_lo;

	var minus = byte_hi & (1<<7);
	if (minus) {
		value--;
		value = value ^ 0xFFFF;
		value *= -1;
	}
	return value;
};
var convert_to_uint16 = function(payload, offset) {
	var byte_hi = payload.charCodeAt(offset);
	var byte_lo = payload.charCodeAt(offset+1);

	var value = (byte_hi<<8) + byte_lo;

	return value;
};

var cmd_build = function(mcmd, addr, cmd, payload) {
	return "#" + mcmd + ":" +
			String.fromCharCode(addr*1) + "," +
			String.fromCharCode(cmd) + "," +
			payload + ".";
};
var sendport = function(port, addr, cmd, payload) {
	var data = cmd_build("Put", addr, cmd, payload);
	port.write_buffer(data);
};

var write_bit = function(addr, bit, value) {
	var cmd = 0xF1;
	var toggle = 0;
	var set = 0;
	var clear = 0;

	value = value*1;
	if (value) {
		set = 1<<bit;
	} else {
		clear = 1<<bit;
	}
	var payload = String.fromCharCode(0,toggle,set,clear);
	return cmd_build("Put", addr, cmd, payload);
};


var agsBus_types = {};
// Licht-Client V2
agsBus_types.LiV2 = {
	"init": function(router, basename, addr) {
		for (var j=0; j<8;j++) {
			name = "/" + addr + "/"+j+"_output";
			var ids = addr+"/"+j;
			router.register(basename + name + "_s", "agsbus", ids, undefined, false);
		}
	},
	"read": function(router, basename, addr, payload) {
		read_bits(router, basename + "/" + addr,
				"_output", 0,
				payload.substring(0,1));
		read_bits(router, basename + "/" + addr,
				"_short_push", 0,
				payload.substring(1,2));
		read_bits(router, basename + "/" + addr,
				"_long_push", 0,
				payload.substring(2,3));
		read_bits(router, basename + "/" + addr,
				"_switchtype", 0,
				payload.substring(3,4));
	},
	"write": function(addr, channel, value) {
		return write_bit(addr, channel, value)
	}
};
agsBus_types.Temp = {
	"read": function(router, basename, addr, payload) {
		var time  = Date.now()/1000;
		for (var b=0;b<2;b++) {
			var temp = convert_to_int16(payload, b*2);
			temp /= 10;
			
			var name = "/" + addr + "/" + b + "_temp";
			//console.log(name + ": " + value);
			router.route(basename + name, time, temp);
		}
	}
};
// Tuer:
agsBus_types.indS = {
	"read": function(router, basename, addr, payload) {
		var time  = Date.now()/1000;
		var value = 0;
		if (payload.substring(3,4) == "x") {
			value = 1;
		}
		var name = "/" + addr + "/" + "door_state";
		router.route(basename + name, time, value);
	}

};
// Aetze:
agsBus_types.Aetz = {

};
agsBus_types["04io"] = {
	"init": function(router, basename, addr) {
		for (var j=0; j<8;j++) {
			name = "/" + addr + "/"+j + "_output";
			var ids = addr+"/"+j;
			router.register(basename + name + "_s", "agsbus", ids, undefined, false);
		}
	},
	"read": function(router, basename, addr, payload) {
		read_bits(router, basename + "/" + addr,
			"_output", 0,
			payload.substring(0,1));
		read_bits(router, basename + "/" + addr,
			"_input", 0,
			payload.substring(1,2));
	
	},
	"write": function(attr, channel, value) {
		return write_bit(addr, channel, value)
	}
};
agsBus_types["8i6o"] = agsBus_types["04io"];


// ags bus clients:
var agsBus_clients = [];
var register_type = function(router, basename, addr, type) {
	var old_payload = undefined;
	if (typeof agsBus_clients[addr] === "object") {
		old_payload = agsBus_clients[addr][0];
	}
	if (typeof agsBus_clients[addr] !== "string")
		agsBus_clients[addr] = type;

	if (typeof agsBus_types[type] !== "undefined") {
		if (typeof agsBus_types[type].init == "function") {
			agsBus_types[type].init(router, basename, addr);
		}

		// process old payload
		if (typeof old_payload !== "undefined" &&
				typeof agsBus_types[type].read == "function") {
			agsBus_types[type].read(router, basename, addr,
					old_payload);
		}
	} else {
		console.log("Undefined client type: ", type);
	}
};
var process_agsbus = function(router, basename, mcmd, margs, port) {
	if (mcmd == "Got") {
		//console.log("Got Activity");
		var result2 = margs.match(/^(.|\n|\r),(.|\n|\r),((?:.|\n|\r){4})$/);
		if (result2) {
		var addr  = result2[1].charCodeAt(0);
		var cmd   = result2[2].charCodeAt(0);
		var payload = result2[3];
		if (cmd == 0xE4) {
			if (typeof agsBus_clients[addr] === "string") {
				var type = agsBus_clients[addr];
				
				if (typeof agsBus_types[type] !== "undefined" &&
						typeof agsBus_types[type].read == "function") {
					agsBus_types[type].read(router, basename, addr, payload);
				}

			} else {
				agsBus_clients[addr] = [payload];
				sendport(port, addr, 0xF9, "Type");
			}
		}
		else if (cmd == 0xE9) {
			var type = payload;
			
			register_type(router, basename, addr, type);
		}
		else if (cmd == 0xE1) {
			// is a response to 0xF1, to change values.
		}
		else {
			console.log("Unknown Command in got packet: ",
					cmd);
		}
		} else {
			console.log("Error: packet got, agsbus structure not recognized: ",
					showbytes(margs));
		}
	} else if (mcmd == "ErT") {
		// do nothing.
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

	port.wbuffer = [];
	port.sending = false;
	port.timer = undefined;
	/*port.buffer_size = function(comment) {
		console.log("Buffer " + this.wbuffer.length + " @ " + comment);
	}*/
	port.write_buffer = function(data) {
		console.log("COMMAND: ", showbytes(data));
		this.wbuffer.push(data);
		//this.buffer_size("+1");
		this.write_send();
	};
	port.write_send = function() {
		if (!this.sending) {
			if (typeof this.timer !== "undefined" && this.timer) {
				clearTimeout(this.timer);
			}
			this.timer = undefined;

			if (this.wbuffer.length) {
				this.sending = true;
				var data = this.wbuffer.splice(0,1);
				data = data[0];

				console.log("COMMAND: ", showbytes(data));

				this.write(new Buffer(data, 'binary'));
				this.timer = setTimeout(function(p) {
					p.write_done()
				}, 100, this);
				//this.buffer_size("-1");
			}
		} else {
			if (typeof this.timer === "undefined" || !this.timer) {
				this.timer = setTimeout(function(p) {
						p.write_done()
					}, 100, this);
			}
		}
	};
	port.write_done = function() {
		//this.buffer_size(".");
		this.sending = false;
		this.write_send();
	}



	var buffer = ""; 
	port.on('data', function(data) {
		var str = data.toString('binary');
		//console.log("DATA: " + showbytes(str));
		buffer += str;
		//console.log("BUFFER: " + showbytes(buffer));
		//var agsbus_regex = /^(?:.|\n)*?#(.+?):((?:.|\n)+?)\.((?:.|\n)*)$/;
		var agsbus_regex = /^((?:.|\n|\r)*?)#(.+?):((?:.|\n|\r)+?)\.((?:.|\n|\r)*)$/;
		var result = buffer.match(agsbus_regex);
		if (result)
			port.write_done();
		while (result) {
			var b_pre = result[1];
			var mcmd = result[2];
			var margs = result[3];
			var b_post = result[4];

			if (b_pre.length != 0) {
				console.log("Nicht erkannt: " + showbytes(b_pre));
			}

			process_agsbus(router, basename, mcmd, margs, port);
			
			buffer = b_post;
			result = buffer.match(agsbus_regex);
		}
		//console.log("end -- search for Activties");
	});
	 
	port.on('error', function(err) {
		  console.log(err);
	});
	 
	port.on('open', function() {
		//port.write_buffer("#BMa:GetState.");
		port.write_buffer("#BMa:GetState.");
		//port.write_buffer("#BMa:GetState.");
	});

	router.dests.agsbus = function(id, time, value) {
		var ids = id.split("/");
		var addr = ids[0]*1;
		var channel = ids[1]*1;

		if (typeof agsBus_clients[addr] !== "string")
			return;
		var type = agsBus_clients[addr];

		if (typeof agsBus_types[type] !== "undefined" &&
				typeof agsBus_types[type].write == "function") {
			var data = agsBus_types[type].write(addr, channel,
					value);

			//console.log("COMMAND: ", showbytes(data));
			port.write_buffer(data);
		}

	};
};

