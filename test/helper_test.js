
/*
 * Fail test after 30s automatically
 */

var console_error = console.error;
var console_info = console.info;
var process_exit = process.exit;

var t1 = setTimeout(function() {
	console_error("Test run longer than 30 sec. Exiting ...");
	process_exit(1);
}, 1000*30);
t1.unref();

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

exports.get_node_list = function(r) {
	return Object.keys(r.nodes).filter(function(nn) {
		return r.nodes[nn].metadata !== null;
	});
};

var first_run = true;
exports.test = function(filename) {
	var test = require('tape');

	if (first_run) {
		process.setMaxListeners(200);
		process.env.OSIOTA_TEST = "1";

		test.createStream().on('data', function (row) {
			row = row.replace(/\n$/, "");
			console_info(row);
		});
		if (process.env.DEBUG != '1') {
			console.debug = ()=>{};
			console.log = ()=>{};
		}
		first_run = false;
	}
	var title = "";
	if (typeof filename === "string") {
		title = filename
				.replace(/.*\//, "")
				.replace(/_/, " - ")
				.replace(/_/g, " ")
				.replace(/\.js/i, "") + ": ";
	}

	return function(subtitle, callback) {
		return test(title+subtitle, callback);
	};
};

exports.sleep = function(ms) {
	return new Promise(resolve=>setTimeout(resolve, ms));
};

exports.try_multiple_times = async function(callback, timeout = 50, times = 10){
	if (times < 0) {
		return false;
	}
	await exports.sleep(timeout);
	if (await callback()) {
		return true;
	}
	return exports.try_multiple_times(callback, timeout, times-1);
};

