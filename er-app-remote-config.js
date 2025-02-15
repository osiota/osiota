const http = require("http");

exports.init = function(node, app_config, main, host_info) {
	const url = app_config.url;

	// todo:
	// warning if not SSL or localhost

	http.get(url, function(res) {
		let body = '';

		res.on('data', function(chunk) {
			body += chunk;
		});

		res.on('end', function() {
			try {
				const config = JSON.parse(body);
				main.sub_config(config);
			} catch (e) {
				console.warn("Remote Config, " +
						"JSON Exception:",
							e.stack || e);
				console.warn("\tMessage:", body);
			}

		});
	}).on('error', function(e) {
		console.warn("Remote Config, HTTP Exception:", e.stack || e);
	});
};
