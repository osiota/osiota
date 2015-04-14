#!/usr/bin/node

var data = {};

var dests = {
	"console":function(id, name, time, value) {
		console.log(id + ": " + name + " [" + time + "]:\t" + value);
	},
	"mysql":function(id, name, time, value) {
		
	},
	"func":function(id, name, time, value) {
		
	}
}

var route_to = {
	"/Klemme_1/Wert_1":[
		{"to": dests.console, "id": "Wert 1", "f": function(v) {return v * 1000; }}
	],
	"/Engel/Energie_P1":[
		{"to": dests.console, "id": "P", "f": function(v) { return v * 1000; }}
	]
};

var register = function(name, ref) {
	console.log("registering " + name);
	if (!route_to.hasOwnProperty(name))
		route_to[name] = [];

	route_to[name].push(ref);
	return ref;
}
var unregister = function(name, ref) {
	console.log("unregistering " + name);
	if (route_to.hasOwnProperty(name)) {
		for(var j=0; j<route_to[name].length; j++) {
			if (route_to[name][j] === ref) {
				route_to[name].splice(j, 1);
				return;
			}
		}
	}
	console.log("\tfailed.");
}


var route = function(name, time, value) {
	data[name] = value;

	//console.log("R: " + name + " [" + time + "]:\t" + value);
	if (route_to.hasOwnProperty(name)) {
		for(var i=0; i<route_to[name].length; i++) {
			var to = route_to[name][i].to;
			var id = route_to[name][i].id;
			var f = route_to[name][i].f;
			var v = value;
			if (f) {
				v = f(v);
			}
			if (!id || id == "") {
				id = name;
			}
			if (typeof to == "function") {
				to(id, name, time, v);
			} else {
				console.log("TO: Unknown function.");
			}
		}
	}
}

route('/Klemme_1/Wert_2', 0, 230);

register('/Klemme_1/Wert_1', {"to": function(id, name, time, v) {
	if (data.hasOwnProperty('/Klemme_1/Wert_2')) {
		v *= 1000;
		v *= data['/Klemme_1/Wert_2'];
		route('/Geraet_2/Energie', time, v);
	}
}, "id": "-"});


var WebSocket = require('ws');

WebSocket.prototype.sendjson = function(data) {
	        this.send(JSON.stringify(data));
};

var WebSocketServer = WebSocket.Server;
var wss = new WebSocketServer({port: 8080});

wss.on('connection', function(ws) {
	ws.send_data = function(id, name, time, value) {
		ws.sendjson({"type":"data", "id":id, "name":name, "time":time, "value":value});
	};
	ws.registered_nodes = [];
	ws.on('message', function(message) {
                console.log('received: %s', message);
		try {
			var data = JSON.parse(message);
			if (data.hasOwnProperty('command')) {
				if (data.command == 'register' && data.hasOwnProperty('node')) {
					var ref = register(data.node, {"to": ws.send_data, "id": data.node, "obj": ws});
					ws.registered_nodes.push({"node": data.node, "ref": ref});
				} else if (data.command == 'get_data') {
					ws.send_json({"type":"dataset", "data":data});
				} else {
					console.log("Unknown command");
				}
			}
		} catch (e) {
			console.log("Exception: " + e);
		}
	});
	ws.on('close', function() {
		for(var i=0; i<ws.registered_nodes.length; i++) {
			unregister(ws.registered_nodes[i].node, ws.registered_nodes[i].ref);
		}
	});
});

var command = "../ethercat_bridge/main";
var args = "";

/*
var spawn = require('child_process').spawn;
var childProcess = spawn(command, args);
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
				var time = result[2];
				var value = result[3];
				route(name, time, value);
			}
		}
	}
});

childProcess.stderr.on("data", function (data) {
	console.error("ERR "+data.toString());
});

*/

process.stdin.setEncoding('utf8');
process.stdin.on('readable', function() {
	var chunk = process.stdin.read();
	if (chunk !== null) {
		var str = chunk.toString();
		var lines = str.split(/\r?\n/g);
		for (var i=0; i<lines.length; i++) {
			if (lines[i] != "") {
				var result = lines[i].match(/^([^\[]+)\s+\[([0-9.]+)\]:\s+([-0-9.]+|undefined)$/);
				if (result) {
					var name = result[1];
					var time = result[2];
					var value = result[3];
					if (value === "undefined") value = null;
					route(name, time, value);
				}
				//process.stdout.write('data: ' + chunk);
			}
		}
	}
});
