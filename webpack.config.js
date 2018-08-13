
var webpack = require('webpack');

var ignore = new webpack.IgnorePlugin(/levelup|^ws$|^webpack$|^\.\/module_history_class_file.js$/);

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
	},
	plugins: [ignore]
};
