var http = require("http");

exports.init = function(node, app_config, main, host_info) {
	var url = app_config.url;

	// todo:
	// warning if not SSL or localhost

	http.get(url, function(res) {
		var body = '';

		res.on('data', function(chunk) {
			body += chunk;
		});

		res.on('end', function() {
			try {
				var config = JSON.parse(body);
				main.sub_config(config);
			} catch (e) {
				console.log("Remote Config, " +
						"JSON Exception: ", e);
				console.log("\tMessage: ", body);
			}

		});
	}).on('error', function(e) {
		console.log("Remote COnfig, HTTP Exception: ", e);
	});
};
