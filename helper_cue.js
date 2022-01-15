
/**
 * Cue data
 */
exports.cue = function(callback) {
	var cue_data = [];
	return function(entry) {
		cue_data.push(entry);
		process.nextTick(function() {
			try {
				if (cue_data.length > 0) {
					var data = cue_data.splice(0,cue_data.length);
					callback(data);
				}
			} catch (e) {
				console.warn("Exception (cue):",
						e.stack || e);
			}
		});
	};
};
/**
 * Cue data, getter
 */
exports.cue_getter = function(callback) {
	var cue_data = [];
	var processing = false;
	return function(entry) {
		if (cue_data.length > 100000) {
			console.warn("Cue data exceeding limit of 100 000 entries. Is your processing function broken? Flushing cue to avoid memory overflow.");
			cue_data = [];
			return;
		}
		cue_data.push(entry);
		process.nextTick(function() {
			try {
				if (cue_data.length > 0 && !processing) {
					processing = true;
					callback(function(err) {
						processing = false;
						if (err) {
							return;
						}
						var data = cue_data.splice(0,cue_data.length);
						return data;
					});
				}
			} catch (e) {
				console.warn("Exception (cue):",
						e.stack || e);
				processing = false;
			}
		});
	};
};

/**
 * direct data processing without cue (for debugging)
 *
 * Was used for MySQL module
 */
exports.no_cue = function(callback) {
	return function(data) {
		try {
			callback(data);
		} catch (e) {
			console.warn("Exception (no_cue):",
					e.stack || e);
		}
	};
};

