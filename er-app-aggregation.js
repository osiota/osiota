
var _ = require('underscore');

var groups = [];

exports.init = function(node, app_config, main, host_info) {
	this.policy_checker = main.router.policy_checker;
	this.router = main.router;

	this.activate_policy(app_config);
};

exports.activate_policy = function(policy) {
	var group = this.get_group(policy, module);
	if (group == null) {
		this.init_group(policy, module.wpath);
	}
};


//--------------------------  methods for grouping nodes depending on policy-action-extras ---------------------------


exports.init_group = function (policy, remote_id){
    var group_node = this.create_group_node(policy.action_extra.group);

    var group_callback;
    var group_entry;
    //init callback and link data from callback to group_node
    if (policy.action_extra.type == "time"){
        group_callback = this.create_callback_by_time(group_node, policy, function (time, value, group_node) {
            group_node.publish(time, value);
        });
    }else{ // policy.action_extra.type = count
        group_callback = this.create_callback_by_count(group_node, policy, function(time, value, group_node) {
            group_node.publish(time, value);
        });
    }
    //create and add group-entry;
    var group_entry = {};
    group_entry.node = policy.node;
    group_entry.metadata = policy.metadata;
    group_entry.remote = remote_id;
    group_entry.nodes = [];
    group_entry.function = group_callback;
    groups.push(group_entry);

    //link data from nodes to callback
    this.get_nodes_for_group(policy, module.wpath, group_callback, group_entry);

};

exports.get_group = function (policy, ws){
    for (var i = 0; i < groups.length; i++) {
        if(groups[i].node == policy.node
            && _.isEqual(groups[i].metadata, policy.metadata)
            && groups[i].remote == ws.wpath){
            return groups[i];
        }
    }
    return null;
};

/* not used:
exports.update_group = function (node, group){
    group.nodes.push(node.name);
    node.subscribe(group.function);
};
*/

exports.create_group_node = function (group_node_name, ws) {
    var count = 0;
    var new_group_node_name = group_node_name;
    var router = this.router;

    function check_if_already_used(group_node_name){
        if(router.nodes.hasOwnProperty(group_node_name)){
            count ++;
            new_group_node_name = count+group_node_name;
            check_if_already_used(new_group_node_name);
        }
    }
    check_if_already_used(group_node_name);

    var group_node = router.node(new_group_node_name);
    group_node.group_node = 'true';
    this.add_policy("user_level",
        {
            "node": new_group_node_name,
            "action": "forward_all"
        }
    );
    group_node.announce({
        "type": "energy.data"
    });
    return group_node;
};

exports.get_nodes_for_group = function (policy, wpath, group_callback, group_entry) {
    var _this = this;
    this.router.node("/").subscribe_announcement(function(node, method, initial) {
        if (!node.hasOwnProperty('group_node')) {
            group_entry.nodes.push(node);

	    // TODO: warum wird hier noch eine policy gesucht?
            var this_policy = _this.policy_checker.find_most_relevant_policy(node, wpath, node.get_metadata(), "read");
            if(_.isEqual(policy, this_policy)){
                node.subscribe(group_callback);
            }
        }
    });
};


// the aggregated value is published by the group_node after n values got received
exports.create_callback_by_count = function (destination_node, policy, publish_to) {
    var _this = this;
    var values = {};
    var memory = {};
    var interval_start;
    var count = 0;

    // calculates and publishes aggregated value
    function calc_and_publish(node){
        count++;
        if (!(count < policy.action_extra.interval)) {
            // calculates aggregated value
            var result = _this.aggregate_values(policy.action_extra.method, values, memory, interval_start, node.time);
            // saving last value of every node to memory-variable so the integral can be fully calculated
	    for (var node_name in values){
		if (values[node_name].length > 0) {
	            memory[node_name] = values[node_name][values[node_name].length-1]
		}
            }

            values = {};
            count = 0;
            // publishes aggregated value
            publish_to(node.time, result, destination_node);
            interval_start = node.time;
        }
    }

    return function(do_not_add_to_history, initial){
        // collecting node values
        var node = this;
        if (node.time != null){
            if (typeof interval_start == 'undefined'){
                interval_start = node.time;
            }
            if (!values.hasOwnProperty(node.name)){
                values[node.name] = [];
            }
            values[node.name].push({
                time: node.time,
                value: node.value
            });
            calc_and_publish(this);
        }
    }
};


// the aggregated value is published by the group_node after x seconds passed
exports.create_callback_by_time = function (destination_node, policy, publish_to) {
    var values = {};
    var memory = {};
    var interval_start = new Date()/1000;
    var interval_end;

    // calculates and publishes aggregated value
    setInterval(function(method, destination_node, _this){
        interval_end = new Date()/1000;
        // calculate
        var result = _this.aggregate_values(method, values, memory, interval_start, interval_end);
        // saving last value of every node to memory-variable so the integral can be fully calculated
        for (var node_name in values){
		if (values[node_name].length > 0) {
	            memory[node_name] = values[node_name][values[node_name].length-1]
		}
        }
        values = {};
        // publish
        publish_to(interval_end, result, destination_node);
        interval_start = interval_end;
    }, policy.action_extra.interval*1000, policy.action_extra.method, destination_node, this);

    return function(do_not_add_to_history, initial){
        // collecting node values
        var node = this;
        if (node.time !== null){
            if (!values.hasOwnProperty(node.name)){
                values[node.name] = [];
            }
            values[node.name].push({
                time: node.time,
                value: node.value*1
            });
        }
    }
};


// ----------------------------- methods for calculating an aggregated value -------------------------------------------


exports.aggregate_values = function (method, value_group ,memory, interval_start, interval_end) {
    if (method == "sum") {
        return calculate_sum(value_group);
    } else if (method == "average") {
        return calculate_avg(value_group);
    } else if (method == "integral") {
        return calculate_integral(value_group, memory, interval_start, interval_end);
    } else if (method == "integral_avg"){
        var integral = calculate_integral(value_group, memory, interval_start, interval_end);
        return calculate_integral_avg(integral, interval_start, interval_end);
    } else if (method == "min") {
        return calculate_min(value_group);
    } else if (method == "max") {
        return calculate_max(value_group);
    }
};

function calculate_sum(value_group) {
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

function calculate_avg(value_group) {
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

}

// TODO: Die Nutzung von fremden Zeitstempeln ist gefährlich.
function calculate_integral(value_group, memory, interval_start, interval_end) {
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
        }else{
            value = memory[node].value
        };
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
}

// Was tut das round dort?
function calculate_integral_avg(integral, interval_start, interval_end) {
    var timespan = interval_end - interval_start;
    return integral / timespan;
}

function calculate_min(value_group) {
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
}

function calculate_max(value_group) {
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
}
