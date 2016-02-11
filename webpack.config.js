module.exports = {
	entry: "./webpack_router_main.js",
	target: "web",
	output: {
		library: 'energy-router',
		libraryTarget: 'umd',
		path: __dirname,
		filename: "webpack-energy-router.js"
	},
	node: {
		console: false,
		process: "mock",
		global: true
	},
	module: {
		loaders: [
			{ test: /\.css$/, loader: "style!css" }
		]
	}
};
