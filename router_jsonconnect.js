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

				for (var from in static_routes) {
					if (typeof static_routes[from] === "Array") {
						for (var tid=0; tid<static_routes[from].length; tid++) {
							router.connect(from, static_routes[from][tid]);
						}
					} else {
						router.connect(from, static_routes[from]);
					}
				}
			} catch (e) {
				console.log("JSONConnect, on message, Exception: ", e);
				console.log("\tMessage: ", body);
			}

		});
	}).on('error', function(e) {
		console.log("Got error: ", e);
	});
};
