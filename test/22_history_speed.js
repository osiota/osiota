#!/usr/bin/env node

const assert = require('assert').strict;
const hcf = require("../module_history_class_file");
//const hcf = require("../module_history_class_file_old");

var node = {"name": "db_for_speedtest"};
var config = {"filename": "0.vdb"};
var history = new hcf.history(node, config);

var d = new Date("2021-01-01:12:00:00")/1000;
var prepare = function(history) {
	for(var i=0; i<=10005; i++) {
		history.add(d+i, i);
	}
};
var cleanup = function(history) {
	history.vdb.clear({}, function(err) {
		if (err) {
			console.warn("Error:", err);
		}
	});
};

//prepare(history);

setTimeout(function() {
	console.log("get first 10.000 elements");
	var hrstart = process.hrtime()
	history.get({
		"maxentries": 10000,
		"fromtime": d+2,
		"totime": d+2+2+10000,
		"reverse_align": false,
	}, function(hdata) {
		hrend = process.hrtime(hrstart);
		console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)
		console.log("length:", hdata.length);
	});
}, 500);
