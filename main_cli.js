#!/usr/bin/env node

var os = require("os");
var main = require("./main.js");

var argv = require('yargs')
	.usage('Usage: $0 [-args]', {
		hostname: {
			alias: "h",
			describe: "set hostname",
			default: os.hostname(),
			type: "string"
		},
		app: {
			alias: "a",
			describe: "start an app",
			type: "string"
		},
		"auto_install": {
			describe: "automatically install new apps",
			type: "boolean",
			default: false
		},
		server: {
			alias: "s",
			describe: "create websocket server",
			type: "number"
		},
		remote: {
			alias: "r",
			describe: "connect to a websocket server (url + data resource)",
			type: "string"
		}
	})
	.example('$0 -h pc1 -s 8080 --app.0.name er-app-cluster')
	.help().version().config()
	.argv;

var keys = {
	"remote": ["name", "url", "nodes"],
	"app": ["name", "config"]
};

for (var key in keys) {
	var key_args = keys[key];

	// string to array:
	if (typeof argv[key] !== "object") {
		if (argv[key]) {
			argv[key] = [ argv[key] ];
		} else {
			argv[key] = [];
		}
	}

	if (!Array.isArray(argv[key])) {
		// convert object to array
		if (Object.keys(argv[key]).join("").match(/^\d+$/)) {
			var a = [];
			for (var cid in argv[key]) {
				a.push(argv[key][cid]);
			}
			argv[key] = a;
		}

	} else {
		// split arguments (,)
		var a = [];
		for (var cid in argv[key]) {
			if (typeof argv[key][cid] === "string") {
				var elements = argv[key][cid].split(/,/);
				var arg_no = 0;
				var object = {};
				for(var eid in elements) {
					if (arg_no >= key_args.length) {
						if (!Array.isArray(key_args[arg_no])) {
							key_args[arg_no] = [ key_args[arg_no] ];
						}
						key_args[arg_no].push(elements[eid]);
					} else {
						var arg_name = key_args[arg_no++];
						object[arg_name] = elements[eid];
					}
				}
				a.push(object);
			} else {
				a.push(argv[key][cid]);
			}
		}
		argv[key] = a;
	}
}

// create console
try {
	// TODO: configure logging via options
	require('console-stamp')(console, 'HH:MM:ss');
} catch(err) {

}

var m = new main(argv.hostname);
m.config(argv);

