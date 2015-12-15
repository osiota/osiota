
exports.init = function(router) {
	router.dests.accumulate = function(node, relative_name) {
		if (relative_name !== "") return;

		if (!this.hasOwnProperty("acc_energy")) {
			this.acc_energy = 0;
		}
		var timestamp_last = this.acc_timestamp_last || (node.time - 1);
		var duration_last = node.time - timestamp_last;
		this.acc_energy += node.value * duration_last;

		router.publish(this.id, node.time, this.acc_energy);

		// set last timestamp:
		this.acc_timestamp_last = node.time;
	};
};
