var getByProperty = function(array, key, value) {
	if (Array.isArray(array)) {
		for(var i=0; i<array.length; i++) {
			if (array[i].hasOwnProperty(key) &&
					array[i][key] === value) {
				return value;
			}
		}
	} else {
		if (array.hasOwnProperty(value)) {
			return array[value];
		}
	}
	return null;
};

exports.default_node_name = "../Energieverbrauch";

exports.init = function(node, app_config, main, host_info) {
	if (app_config.states !== "object") {
		throw new Error("states not defined.");
	}
	var interval = 1000;
	if (typeof app_config.interval === "number") {
		interval = app_config.interval*1000;
	}
	var states = app_config.states;
	node.announce({
		"type": "energy.data"
	});
	var power = null;
	var s = this._source.subscribe(function() {
		var new_state = this.value;
		var s = getByProperty(states, "state", new_state);
		if (s !== null) {
			power = s.power;
		} else {
			// stay in old state
		}
	});
	var tid = setInterval(function() {
		node.publish(undefined, power);
	}, interval);
	return [s, node, tid]
}
