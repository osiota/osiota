
var webpack = require('webpack');

var ignore = new webpack.IgnorePlugin(/levelup|^ws$/);

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
	},
	plugins: [ignore]
};
