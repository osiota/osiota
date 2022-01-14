
/*
 * Fail test after 30s automatically
 */

var t1 = setTimeout(function() {
	console.error("Test run longer than 30 sec. Exiting ...");
	process.exit(1);
}, 1000*30);
t1.unref();


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
			console.info(row)
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
