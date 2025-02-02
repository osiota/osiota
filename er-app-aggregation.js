
const match = require("./helper_match").match;

exports.init = function(node, app_config, main, host_info) {

	// check config:
	let method = "integral_avg";
	if (typeof app_config.method === "string") {
		method = app_config.method;
	}
	if (typeof this["calculate_" + method] !== "function") {
		throw new Error("aggregation: method not found: "+method);
	}

	// init node:
	node.group_node = 'true';
	if (main.router.policy_checker) {
		// todo: replace user_level by "programmatic" or app_level
		main.router.policy_checker.add_policy("user_level", {
			"node": node.name,
			"action": "forward_all"
		});
	}
	let metadata = {
		"type": "unknown.data"
	};
	if (typeof app_config.metadata === "object") {
		metadata = app_config.metadata;
	}
	node.announce(metadata);

	// init callback and link data from callback to group_node
	let group_callback;
	if (app_config.type == "time") {
		group_callback = this.create_callback_by_time(app_config,
				node.publish.bind(node));
	} else if (app_config.type == "count") {
		group_callback = this.create_callback_by_count(app_config,
				node.publish.bind(node));
	} else {
		throw new Error("Configuration option type has unknown value");
	}

	// link data from nodes to callback
	const source = this._source;
	const s = source.filter(app_config.filter, "announce",
			function(cnode, method, initial, update) {
		if (cnode === node)
			return;

		if (update)
			return;

		return cnode.subscribe(group_callback);
	});

	return [s, node, this.tid];
};


// An aggregated value is published after receiving n values
exports.create_callback_by_count = function(config, publish_to) {
	const _this = this;

	if (typeof config.interval !== "number") {
		config.interval = 10;
	}

	const values = {};
	const memory = {};
	let interval_start;

	// calculates and publishes aggregated value
	function calc_and_publish(node){
		const interval_end = node.time;

		// calculates aggregated value
		const result = _this.aggregate_values(config.method,
				values, memory,
				interval_start, interval_end);

		// publishes aggregated value
		publish_to(node.time, result);

		// saving last value of every node to memory variable
		// so the integral can be fully calculated
		for (const node_name in values) {
			if (values[node_name].length > 0) {
				memory[node_name] = values[node_name][
					values[node_name].length-1
				];
			}
		}

		values = {};
		interval_start = interval_end;
	}

	let count = 0;

	return function(do_not_add_to_history, initial){
		if (this.time === null) {
			return;
		}
		if (typeof this.value !== "number") {
			return;
		}
		if (typeof interval_start == 'undefined'){
			interval_start = this.time;
		}
		if (!values.hasOwnProperty(this.name)){
			values[this.name] = [];
		}
		values[this.name].push({
			time: this.time,
			value: this.value
		});

		count++;
		if (count >= config.interval) {
			calc_and_publish(this);
			count = 0;
		}
	};
};


// An aggregated value is published every x seconds
exports.create_callback_by_time = function(config, publish_to) {
	const _this = this;

	if (typeof config.interval !== "number") {
		config.interval = 10;
	}

	const values = {};
	const memory = {};
	const interval_start = new Date()/1000;

	// calculates and publishes aggregated value
	this.tid = setInterval(function(){
		// TODO: Using other time stamps can leed to problems
		const interval_end = new Date()/1000;

		// calculate
		const result = _this.aggregate_values(config.method,
				values, memory,
				interval_start, interval_end);

		// publish
		publish_to(interval_end, result);

		// saving last value of every node to memory variable
		// so the integral can be fully calculated
		for (const node_name in values) {
			if (values[node_name].length > 0) {
				memory[node_name] = values[node_name][
					values[node_name].length-1
				];
			}
		}

		values = {};
		interval_start = interval_end;
	}, config.interval*1000);

	return function(do_not_add_to_history, initial){
		// collecting node values
		if (this.time === null) {
			return;
		}
		if (typeof this.value !== "number") {
			return;
		}
		if (!values.hasOwnProperty(this.name)){
			values[this.name] = [];
		}
		values[this.name].push({
			time: this.time,
			value: this.value
		});
	};
};


// methods for calculating an aggregated value

exports.aggregate_values = function(method, value_group, memory,
			interval_start, interval_end) {
	if (typeof method !== "string") {
		method = "integral_avg";
	}
	if (typeof this["calculate_" + method] === "function") {
		return this["calculate_" + method](value_group, memory,
				interval_start, interval_end);
	}
};

exports.calculate_sum = function(value_group) {
	let result = null;
	let values;
	for (const node in value_group) {
		values = value_group[node];
		for (let i = 0; i < values.length; i++) {
			result += values[i].value;
		}
	}
	return result;
}

exports.calculate_average = function(value_group) {
	let result = null;
	let value_count = 0;
	let values;
	for (const node in value_group) {
		values = value_group[node];
		for (let i = 0; i < values.length; i++) {
			result += values[i].value;
			value_count++;
		}
	}
	return result / value_count;
};

// TODO: using other time stamps can leed to problems.
exports.calculate_integral = function(value_group, memory,
			interval_start, interval_end) {
	let result = 0;
	let values;
	// for calculating parts of the integral
	let value;
	let upper_limit;
	let lower_limit;
	let interval;

	for (const node in value_group) {
		values = value_group[node];
		if (typeof memory[node] === "undefined") {
			value = 0;
			//return null;
		} else {
			value = memory[node].value
		}
		lower_limit = interval_start;
		upper_limit = values[0].time;
		interval = Math.max(upper_limit-lower_limit,0);
		result += interval * value;
		for (let i = 0; i < values.length-1; i++) {
			if (values[i].time > interval_start) {
				value = values[i].value;
				upper_limit = values[i+1].time;
				lower_limit = values[i].time;
				interval = Math.max(upper_limit-lower_limit,0);
				result += interval * value;
			}
		}
		value = values[values.length-1].value;
		upper_limit = interval_end;
		lower_limit = values[values.length-1].time;
		interval = Math.max(upper_limit-lower_limit,0);
		result += interval * value;
	}
	return result;
};

exports.calculate_integral_avg = function(value_group, memory,
					interval_start, interval_end) {

	const integral = this.calculate_integral(value_group, memory,
			interval_start, interval_end);
	if (integral === null)
		return null;

	const timespan = interval_end - interval_start;
	return integral / timespan;
};

exports.calculate_min = function(value_group) {
	let result = null;
	let values;
	for (const node in value_group) {
		values = value_group[node];
		for (let i = 0; i < values.length; i++) {
			if (result === null){
				result = values[i].value;
			}else{
				result = Math.min(result, values[i].value);
			}
		}
	}
	return result
};

exports.calculate_max = function(value_group) {
	let result = null;
	let values;
	for (const node in value_group) {
		values = value_group[node];
		for (let i = 0; i < values.length; i++) {
			if (result === null){
				result = values[i].value;
			}else{
				result = Math.max(result, values[i].value);
			}
		}
	}
	return result;
};
