#!/usr/bin/env node

const assert = require('assert').strict;
const hcf = require("../module_history_class_file");
//const hcf = require("../module_history_class_file_old");

var node = {"name": "db_for_test"};
var config = {"filename": "0.vdb"};
var history = new hcf.history(node, config);

var d = new Date("2021-01-01:12:00:00")/1000;
var prepare = function(history) {
	for(var i=0; i<=100; i++) {
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
	console.log("get first 10 elements (0 excluded)");
	history.get({
		"maxentries": 10,
		"fromtime": d,
		"reverse_align": true,
	}, function(hdata) {
		//console.error(JSON.stringify(hdata, null, "\t"));
		var data = hdata.map(function(d) { return d.value; });
		console.log("data", data);
		assert.deepEqual(data, [1,2,3,4,5,6,7,8,9,10], "data was not as expected");
		//cleanup(history);
	});
}, 500);
setTimeout(function() {
	console.log("get last 5 elements");
	history.get({
		"maxentries": 5,
		"fromtime": d,
		"reverse_align": false,
	}, function(hdata) {
		//console.error(JSON.stringify(hdata, null, "\t"));
		var data = hdata.map(function(d) { return d.value; });
		console.log("data", data);
		assert.deepEqual(data, [96,97,98,99,100], "data was not as expected");
	});
}, 1000);

setTimeout(function() {
	console.log("get 3 element with from");
	history.get({
		"maxentries": 3,
		"fromtime": d+10,
		"reverse_align": true,
	}, function(hdata) {
		//console.error(JSON.stringify(hdata, null, "\t"));
		var data = hdata.map(function(d) { return d.value; });
		console.log("data", data);
		assert.deepEqual(data, [11,12,13], "data was not as expected");
	});
}, 1500);

setTimeout(function() {
	console.log("get range");
	history.get({
		"maxentries": 3000,
		"fromtime": d+10,
		"totime": d+14,
		"reverse_align": true,
	}, function(hdata) {
		//console.error(JSON.stringify(hdata, null, "\t"));
		var data = hdata.map(function(d) { return d.value; });
		console.log("data", data);
		assert.deepEqual(data, [11,12,13], "data was not as expected");
	});
}, 1500);

setTimeout(function() {
	console.log("get range");
	history.get({
		"maxentries": 3000,
		"fromtime": d+10,
		"totime": d+14,
		"reverse_align": false,
	}, function(hdata) {
		//console.error(JSON.stringify(hdata, null, "\t"));
		var data = hdata.map(function(d) { return d.value; });
		console.log("data", data);
		assert.deepEqual(data, [11,12,13], "data was not as expected");
	});
}, 2000);
