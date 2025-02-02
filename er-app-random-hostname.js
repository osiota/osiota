
exports.init = function(node, app_config, main) {
	let prefix = main.router.name + "-";
	if (typeof app_config.prefix === "string") {
		prefix = app_config.prefix;
	}

	//http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
	const s = Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15);

	main.router.name = prefix + s;

	console.log("new hostname:", main.router.name);
};
