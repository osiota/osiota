
var _ = require('underscore');

exports.init = function(node, app_config, main, host_info) {

	// init node:
	node.group_node = 'true';
	main.router.policy_checker.add_policy("user_level", {
		"node": node.name,
		"action": "forward_all"
	});
	node.announce({
		"type": "energy.data"
	});

	// init callback and link data from callback to group_node
	var group_callback;
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
	var source = this._source;
	var s = source.subscribe_announcement("announce",
			function(cnode, method, initial) {
		if (cnode === node)
			return;

		if (!app_config.recursive &&
				cnode.parent_node !== source) {
			return;
		}

		if (typeof app_config.metadata === "object" &&
				!_.isMatch(cnode.metadata,app_config.metadata)){
			return;
		}

		return cnode.subscribe(group_callback);
	});

	return [s, this.tid];
};


// An aggregated value is published after receiving n values
exports.create_callback_by_count = function(config, publish_to) {
	var _this = this;

	var values = {};
	var memory = {};
	var interval_start;

	// calculates and publishes aggregated value
	function calc_and_publish(node){
		var interval_end = node.time;

		// calculates aggregated value
		var result = _this.aggregate_values(config.method,
				values, memory,
				interval_start, interval_end);

		// publishes aggregated value
		publish_to(node.time, result);

		// saving last value of every node to memory variable
		// so the integral can be fully calculated
		for (var node_name in values) {
			if (values[node_name].length > 0) {
				memory[node_name] = values[node_name][
					values[node_name].length-1
				];
			}
		}

		values = {};
		interval_start = interval_end;
	}

	var count = 0;

	return function(do_not_add_to_history, initial){
		if (this.time != null){
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
		}
	};
};


// An aggregated value is published every x seconds
exports.create_callback_by_time = function(config, publish_to) {
	var _this = this;

	var values = {};
	var memory = {};
	var interval_start = new Date()/1000;

	// calculates and publishes aggregated value
	this.tid = setInterval(function(){
		// TODO: Using other time stamps can leed to problems
		var interval_end = new Date()/1000;

		// calculate
		var result = _this.aggregate_values(config.method,
				values, memory,
				interval_start, interval_end);

		// publish
		publish_to(interval_end, result);

		// saving last value of every node to memory variable
		// so the integral can be fully calculated
		for (var node_name in values) {
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
		if (this.time !== null){
			if (!values.hasOwnProperty(this.name)){
				values[this.name] = [];
			}
			values[this.name].push({
				time: this.time,
				value: this.value*1
			});
		}
	};
};


// methods for calculating an aggregated value

exports.aggregate_values = function(method, value_group, memory,
			interval_start, interval_end) {
	if (typeof this["calculate_" + method] === "function") {
		return this["calculate_" + method].apply(this, arguments);
	}
};

exports.calculate_sum = function(value_group) {
	var result = null;
	var values;
	for (var node in value_group) {
		values = value_group[node];
		for (var i = 0; i < values.length; i++) {
			result += values[i].value;
		}
	}
	return result;
}

exports.calculate_average = function(value_group) {
	var result = null;
	var value_count = 0;
	var values;
	for (var node in value_group) {
		values = value_group[node];
		for (var i = 0; i < values.length; i++) {
			result += values[i].value;
			value_count ++
		}
	}
	return result / value_count;
};

// TODO: using other time stamps can leed to problems.
exports.calculate_integral = function(value_group, memory,
			interval_start, interval_end) {
	var result = null;
	var values;
	// for calculating parts of the integral
	var value;
	var upper_limit;
	var lower_limit;
	var interval;

	for (var node in value_group) {
		values = value_group[node];
		if (typeof memory[node] === "undefined") {
			value = 0;
			return null;
		} else {
			value = memory[node].value
		}
		lower_limit = interval_start;
		upper_limit = values[0].time;
		interval = Math.max(upper_limit-lower_limit,0);
		result += interval * value;
		for (var i = 0; i < values.length-1; i++) {
			value = values[i].value;
			upper_limit = values[i+1].time;
			lower_limit = values[i].time;
			interval = Math.max(upper_limit-lower_limit,0);
			result += interval * value;
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

	var integral = this.calculate_integral(value_group, memory,
			interval_start, interval_end);

	var timespan = interval_end - interval_start;
	return integral / timespan;
};

exports.calculate_min = function(value_group) {
	var result = null;
	var values;
	for (var node in value_group) {
		values = value_group[node];
		for (var i = 0; i < values.length; i++) {
			if (result == null){
				result = values[i].value;
			}else{
				result = Math.min(result, values[i].value);
			}
		}
	}
	return result
};

exports.calculate_max = function(value_group) {
	var result = null;
	var values;
	for (var node in value_group) {
		values = value_group[node];
		for (var i = 0; i < values.length; i++) {
			if (result == null){
				result = values[i].value;
			}else{
				result = Math.max(result, values[i].value);
			}
		}
	}
	return result;
};
