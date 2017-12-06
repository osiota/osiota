#!/usr/bin/env node

var main = require("./main_nodejs.js");
var m = new main();

var argv = require('yargs')
	.usage('Usage: $0 [-app_config]', {
	})
	.example("$0 --install_dir=./ install-apps-git install_app rest-api")
	.help().version()
	.argv;

var app = argv._.shift();

m.startup(null, app, argv, undefined, undefined,
		function(a) {
	argv._.push(function(err, result) {
		if (err) {
			console.log("RPC error:", err, result);
			throw err;
		}
		console.log("result", result);
	});
	a._node.rpc.apply(a._node, argv._);
});
