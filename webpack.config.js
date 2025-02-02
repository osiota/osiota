
const webpack = require('webpack');

const ignore = new webpack.IgnorePlugin({
	resourceRegExp: /levelup|^ws$|^webpack$|^\.\/module_history_class_file.js$/
});

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
	resolve: {
		fallback: {
			process: require.resolve('process/browser'),
		}
	},
	module: {
	},
	plugins: [ignore]
};
