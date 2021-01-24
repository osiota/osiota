
exports.get_node_list = function(r) {
	return Object.keys(r.nodes).filter(function(nn) {
		return r.nodes[nn].metadata !== null;
	});
};

var first_run = true;
exports.test = function() {
	var test = require('tape');

	if (first_run) {
		process.env.OSIOTA_TEST = "1";

		test.createStream().on('data', function (row) {
			row = row.replace(/\n$/, "");
			console.info(row)
		});
		console.debug = ()=>{};
		console.log = ()=>{};
		first_run = false;
	}

	return test;
};
