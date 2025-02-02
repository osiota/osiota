/*
 * Inform that no event occured for the length of variable timeout.
 */
exports.init = function(node, app_config, main) {
	node.announce({
		"type": "noevent.event",
		"history": false
	});

	let timeout = 60000;
	if (typeof app_config.timeout === "number") {
		timeout = app_config.timeout;
	}

	let already_send = false;

	const callback_noevent = function() {
		already_send = true;

		if (already_send && app_config.no_duplicates) {
			return;
		}

		node.publish(undefined, "No event.");
	};

	const tid = [];
	const reset_timeout = function() {
		already_send = false;

		clearTimeout(tid[0]);
		tid[0] = setTimeout(callback_noevent, timeout);
	};

	reset_timeout();

	const s = this._source.subscribe(function(do_not_add_to_history, initial){
		reset_timeout();
	});

	return [tid, s, node];
};
