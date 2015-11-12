var http = require("http");

exports.init = function(router, url) {

	http.get(url, function(res) {
		var body = '';

		res.on('data', function(chunk) {
			body += chunk;
		});

		res.on('end', function() {
			try {
				var static_routes = JSON.parse(body)
				router.connectArray(static_routes);
			} catch (e) {
				console.log("JSONConnect, on message, Exception: ", e);
				console.log("\tMessage: ", body);
			}

		});
	}).on('error', function(e) {
		console.log("Got error: ", e);
	});
};
