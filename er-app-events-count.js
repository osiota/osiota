
exports.init = function(node, app_config, main) {
	let count = 0;
	node.announce({
		"type": "count.data",
		"history": false
	});
	node.publish(undefined, count);

	const s = this._source.subscribe(function(do_not_add_to_history, initial){
		if (this.value === null) return;
		if (do_not_add_to_history && count != 0) {
			// add one, if there are values not to be added to
			// history.
			return;
		}

		node.publish(this.time, ++count);
	});

	return [s, node];
};
