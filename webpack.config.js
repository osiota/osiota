
var webpack = require('webpack');

var ignore = new webpack.IgnorePlugin(/levelup|^ws$|^webpack$|^\.\/module_history_class_file.js$/);

module.exports = {
	//TODO: entry: "./main_web.js",
	entry: "./webpack_router_main.js",
	target: "web",
	output: {
		library: 'osiota',
		libraryTarget: 'umd',
		path: __dirname,
		filename: "webpack-osiota.js"
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
