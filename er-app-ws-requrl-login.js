
exports.init = function(node, app_config, main) {
	var allowed_paths = [];
	if (Array.isArray(app_config.allowed_paths)) {
		allowed_paths = app_config.allowed_paths;
	}

	var handler = function(type, ws, req) {
		if (type !== "ws") return;

		//TODO: timing attack possible?
		if (allowed_paths.indexOf(req.url) !== -1) {
			return true;
		}

		console.log("Request url not in allowed paths:", req.url);
		throw new Error("Request url not not allowed.");
	};
	main.router.on("connection", handler);

	return function() {
		main.router.removeListener("connection", handler);
	};
};
