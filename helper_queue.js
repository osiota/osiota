
/**
 * Queue data
 */
exports.queue = function(callback) {
	var queue_data = [];
	return function(entry) {
		queue_data.push(entry);
		process.nextTick(function() {
			try {
				if (queue_data.length > 0) {
					var data = queue_data.splice(0,queue_data.length);
					callback(data);
				}
			} catch (e) {
				console.warn("Exception (queue):",
						e.stack || e);
			}
		});
	};
};
/**
 * Queue data, getter
 */
exports.queue_getter = function(callback) {
	var queue_data = [];
	var processing = false;
	return function(entry) {
		if (queue_data.length > 100000) {
			console.warn("Queue data exceeding limit of 100 000 entries. Is your processing function broken? Flushing queue to avoid memory overflow.");
			queue_data = [];
			return;
		}
		queue_data.push(entry);
		process.nextTick(function() {
			try {
				if (queue_data.length > 0 && !processing) {
					processing = true;
					callback(function(err) {
						processing = false;
						if (err) {
							return;
						}
						var data = queue_data.splice(0,queue_data.length);
						return data;
					});
				}
			} catch (e) {
				console.warn("Exception (queue):",
						e.stack || e);
				processing = false;
			}
		});
	};
};

/**
 * direct data processing without queue (for debugging)
 *
 * Was used for MySQL module
 */
exports.no_queue = function(callback) {
	return function(data) {
		try {
			callback(data);
		} catch (e) {
			console.warn("Exception (no_queue):",
					e.stack || e);
		}
	};
};

