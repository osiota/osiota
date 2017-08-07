const fs = require("fs");

function consume_data(data, offset, cb, done, cleaning_object) {
	var slots = 10000;
	var i = offset;
	var n = Math.min(offset+slots, data.length);
	for (; i < n; i++) {
		var d = data[i];
		cb(d);
	}
	if (i >= data.length) {
		if (typeof done === "function")
			process.nextTick(done);
	} else {
		console.log("time", data[i].time);
		var tid = setTimeout(consume_data, 0, data, n, cb, done,
				cleaning_object);
		cleaning_object[0] = tid;
	}
};

exports.init = function(node, app_config, main, host_info) {
	if (typeof app_config.filename !== "string") {
		throw new Error("config option json filename not defined.");
	}

	var cleaning_object = [];
	
	fs.readFile(app_config.filename, function(err, content) {
		if (err) throw err;

		var data = JSON.parse(content);

		var metadata = {"type": "unknown.data"};
		if (typeof data === "object" && typeof data.data === "object") {
			metadata = data.metadata;
			data = data.data;
		}

		node.announce(metadata);

		consume_data(data, 0, function(d) {
			node.publish(d.time, d.value);
			//node.publish_sync(d.time, d.value);
		}, function() {
			console.log("done");
		}, cleaning_object);
	});

	return [cleaning_object, node];
}
