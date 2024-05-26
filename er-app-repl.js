/*
 * Usage: ./osiota.js --app repl
 *
 * or Usage: ./osiota.js --config er-app-repl-config.json
 */
const repl = require('node:repl');

exports.init = function(node, app_config, main) {

	const options = { useColors: true };

	const r = repl.start(options);
	r.context.main = main;
	r.context.app = this;
	r.context.node = node;
	r.context.source = this._source;
	r.context.target = this._target;

	return [
		r,
		node
	];
};
