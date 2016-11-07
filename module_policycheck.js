/**
 * Created by Saskia on 18.08.2016.
 *
 * This module introduces a security-mechanism to prevent two things:
 *      - it prevents security relevant information from leaving the routers privacy scope.
 *      - and stops unauthorised manipulation of the routers data.
 * It does this by introducing so called 'policies' and continously checking the websocket-communication from
 * and to a remote router.
 *
 *      - Policies can be added by calling addPolicy().
 *      - A Websocket-Connection can be secured by adding it to the secured_connections-array of the routers
 *        Policy_checker-object
 */

var _ = require('underscore');

var v = require('./module_json_validator');

/*
assigns a policy-action to a policy-type
 */
var TYPE_TO_ACTION = {
    read: ['hide_all', 'hide_value_and_metadata', 'hide_value', 'preprocess_value', 'forward_all'],
    write: ['block_write', 'allow_write']
};

/*
assigns the method of an rpc-call to a policy-type depending on where the rpc-call was going to be send to
and defines what methods are needed to checked in the respective szenario.
Methods to be checked when sending an RPC-Call: announce
Methods to be checked when receiving an RPC-Call. subscribe, data, announce
 */
var TYPE_TO_METHOD = {
    to_remote: {
        read: ['announce'],
        write: []
    },
    from_remote:{
        read: ['subscribe'],
        write: ['data', 'announce']
    }
};

/*
Policy_checker contructor
 */
exports.Policy_checker = function(router) {
    this.policy_set = [[], [], []];// policySet[2] = user-level, policySet[1] = application-level, policySet[0] = default-level,
    this.observed_connections = [];
    this.groups = [];
    this.router = router;
};

/*
Checks if the "method" defined in the rpc-call coming from or being send to a remote, is allowed to be executed
for the respective node!

possible results:
    - is allowed: return null
    - is not allowed: abort further processing of the rpc-call
    - is allowed under certain conditions: return policy

 Example call 1:  check("/IBR", "localhost:8080", "subscribe_announcement", "from_remote");
 Example call 2:  check("/TUBS/IBR", "locahlhost:8081", "announce", to remote);
 */
exports.Policy_checker.prototype.check = function (node, remote_id, method, data_flow) {
    if (this.observed_connections.indexOf(remote_id) > -1 ){
        var policy_type = get_type_by_method(method, data_flow);
        if (policy_type != null){
            var policy = this.find_most_relevant_policy(node, remote_id, node.get_metadata(), policy_type);
            return get_reaction(node, remote_id, method, data_flow, policy);
        }
        return null; //method does not need to be evaluated for this data_flow-direction
    }
    return null; //connection is not observed
};

/*
IMPORTANT, when adding more szenarios for other methods don't forget to add the method
to the TYPE-TO-METHOD variable. Because otherwise the Policy-Checker will think that the specific
method doesn't need to be evaluated in the szenario and won't do a full Policy-Check!
 */
function get_reaction (node, remote_id, method, data_flow, policy) {
    var policy_action = policy.action || policy;
    var policy_action_extra = policy.action_extra || null;
    //policy_action_extra = {type:"add",time:10};

    if (data_flow == 'from_remote'){
        if(method == 'announce'){
            if(policy_action.match('block_write|default')){
                throw method+" from remote "+remote_id+" was blocked by Policy-Management";
            }
        }
        else if(method == 'subscribe'){
            if (policy_action.match('hide_all|hide_value_and_metadata|hide_value|default')){
                throw method+" from remote "+remote_id+" was blocked by Policy-Management";
            }
            if(policy_action.match('preprocess_value')) {
                return policy;
            }
        }
        else if(method = 'data'){
            if(policy_action.match('block_write|default')){
                throw method+" from remote "+remote_id+" was blocked by Policy-Management";
            }
        }
    }else if(data_flow == 'to_remote'){
        if(method == 'announce'){
            if (policy_action.match('hide_all|default')){
                throw "announce of '"+node.name+"' to remote "+remote_id+" was blocked by Policy-Management";
            }else if(policy_action == 'hide_value_and_metadata'){
                //remove metadata
                return {reaction_id : 'remove_metadata',
                        args : policy_action_extra};
            } else if (policy_action == 'preprocess_value') {
                if (policy.action_extra.hasOwnProperty('group')) { // aggregating data of group of nodes
                    throw new Error("Blocked by Policy-Management");
                }
            }
        }
    }
    return null; // continue like nothing happened.
}

exports.Policy_checker.prototype.add_observed_connection = function (connection_id) {
    this.observed_connections.push(connection_id);
};

exports.Policy_checker.prototype.remove_observed_connection = function (connection_id) {
    var array = this.observed_connections;
    var index = array.indexOf(connection_id);
    if (index > -1) {
        array.splice(index, 1);
    }
};

exports.Policy_checker.prototype.add_policy = function (policy_level, policy) {
    if (is_valid_policy(policy)) {
        if (policy_level == 'default_level') {
            this.policy_set[0].push(policy);
        } else if (policy_level == 'application_level') {
            this.policy_set[1].push(policy);
        } else if (policy_level == 'user_level') {
            this.policy_set[2].push(policy);
        } else {
            console.log(policy_level + ' is an invalid policy-level! Please choose one of the following: ' +
                'default_level, application_level or user_level');
        }
	this.activate_policy(policy_level, policy);
    }else{
        console.log("Your policy "+ policy.toString() +" has an error!!");
    }
};

exports.Policy_checker.prototype.activate_policy = function (policy_level, policy) {
	if (policy.action == 'preprocess_value') {
		if (policy.action_extra.hasOwnProperty('group')) { // aggregating data of group of nodes
			var group = this.get_group(policy, module);
			if (group == null) {
				this.init_group(policy, module.wpath);
			}
		}
	}
};

/*returns the relevant policy from the given policies-array dependent on the node_name, remote, metadata and policy_type
     - node: node-object
     - remote: remote-id like "ws://localhost:8080"
     - metadata: metadata-object
     - policy-type: can be "read" or "write"
 */
exports.Policy_checker.prototype.find_most_relevant_policy = function (node, remote, metadata, policy_type) {
    var match;
    var policy;
    var policies;
    var mostRelevantPolicy;
    var mostRelevantMatchscore = [[], [], []];
    for (var x = 2; x >= 0; x--) {
        policies = this.policy_set[x];
        for (var y = 0; y < policies.length; y++) {
            if (_.contains(TYPE_TO_ACTION[policy_type], policies[y].action)) {
                policy = policies[y];
                match = check_if_relevant(policies[y], node, remote, metadata);
                if (match[0] == true) {
                    if (check_if_more_relevant(match[1], mostRelevantMatchscore)) {
                        mostRelevantPolicy = policies[y];
                        mostRelevantMatchscore = match[1];
                    }
                }
            }
        }
    }
    if (typeof mostRelevantPolicy != 'undefined') {
        return mostRelevantPolicy;
    }
    return 'default';//if no matching policy was found
};


//--------Functions for finding out if a method/policy-action is classified as a read or write - action----------

function get_type_by_method(method, data_flow) {
    for (var type in TYPE_TO_METHOD[data_flow]){
        if (TYPE_TO_METHOD[data_flow][type].indexOf(method) > -1) {
            return type;
        }
    }
    return null;
}

function get_type_by_action(policy_action) {
    for (var type in TYPE_TO_ACTION) {
        if (_.contains(TYPE_TO_ACTION[type], policy_action)) {
            return type;
        }
    }
    return null;
}


// -----------------------------Policy-related-helper-methods-----------------------------------------------

function is_valid_policy(policy) {
    return v.validate(policy, 'policy_schema');
}

/*
 checks if the policy is relevant for the respective node_name- remote- and metadata-combination
 and returns a matchScores-Array if it is a relevant policy. A policy is relevant when the defined values match
 following criteria:
     - the node_name-variable either has to match the policy-node_name or be a child node of the policy-node_name
     - the remote-variable has to match the policy-remote
     - the metadata defined in the metadata-object has to match the policies-metadata

 matchScores[0]: =0 equals 'perfect match', =1 equals 'directParent', >1 equals indirectParent, nothing equals not defined
 matchScores[1]: =0 equals 'perfect match, empty equals not defined
 matchScores[2]: =0 all key/value-pairs match, >0 some key/value-pairs match, empty equals not defined
 */
function check_if_relevant(policy, node, remote, metadata) {
    var node_name = node.name;
    var relevant = true;
    var matchScores = [[], [], []];
    if (policy.hasOwnProperty('node_name')) {
        if (policy.node_name == node_name || is_parentnode(policy.node_name, node)) {
            matchScores[0].push(get_parent_level(node.router.node(policy.node_name), node));
        } else {
            relevant = false;
        }
    }
    if (policy.hasOwnProperty('remote')) {
        if (policy.remote == remote) {
            matchScores[1].push(0);
        } else {
            relevant = false;
        }
    }
    if (policy.hasOwnProperty('metadata')) {
        if (_.isMatch(metadata, policy.metadata)) {
            matchScores[2].push(0 - ((Object.keys(metadata).length - Object.keys(policy.metadata).length)));
        } else {
            relevant = false;
        }
    }
    return [relevant, matchScores];
}

/*
checks if a relevant policie fits better then another based on the Match-Score.
*/
function check_if_more_relevant(policy_score_array1, policy_score_array2) {
    for (var a = 0; a <= 2; a++) {
        if (policy_score_array1[a].length == 1 && policy_score_array2[a].length == 0)
            return true;
        if (policy_score_array1[a].length == 0 && policy_score_array2[a].length == 1)
            return false;
        if (policy_score_array1[a] < policy_score_array2[a])
            return true;
        if (policy_score_array1[a] > policy_score_array2[a])
            return false;
    }
    return false;
}

/*
checks if the 'parent' is  parent of 'node'
EXAMPLE for parent: ('/IBR/Miklab' , /IBR/Miklab/Lamp.energy)
EXAMPLE for parent: ('/IBR , /IBR/Miklab/Lamp.energy)
*/
function is_parentnode(parent, node) {
    if(parent == node.name){
        return true;
    }
    if (node.parentnode !== null) {
        return is_parentnode(parent, node.parentnode)
    }
    return false;
}

/*
 gets parentlevel for node
 EXAMPLE for parentlevel: ('/IBR/Miklab/Lamp.energy' , '/IBR/Miklab/Lamp.energy') -> level 0
 EXAMPLE for parentlevel: ('/IBR/Miklab' , '/IBR/Miklab/Lamp.energy') -> level 1
 EXAMPLE for parentlevel: ('/IBR' , '/IBR/Miklab/Lamp.energy') -> level 2
 EXAMPLE for parentlevel: ('/' , '/IBR/Miklab/Lamp.energy') -> level 3
*/
function get_parent_level(parent, child) {
    var level = 0;
    var node = child;
    while(parent.name != node.name){
        level ++;
        node = node.parentnode
	if (node === null) {
		throw new Error("get_parent_level: child is not child of parent");
	}
    }
    return level;
}


//--------------------------  methods for grouping nodes depending on policy-action-extras ---------------------------


exports.Policy_checker.prototype.init_group = function (policy, remote_id){
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
    group_entry.node_name = policy.node_name;
    group_entry.metadata = policy.metadata;
    group_entry.remote = remote_id;
    group_entry.nodes = [];
    group_entry.function = group_callback;
    this.groups.push(group_entry);

    //link data from nodes to callback
    this.get_nodes_for_group(policy, module.wpath, group_callback, group_entry);

};

exports.Policy_checker.prototype.get_group = function (policy, ws){
    for (var i = 0; i < this.groups.length; i++) {
        if(this.groups[i].node_name == policy.node_name
            && _.isEqual(this.groups[i].metadata, policy.metadata)
            && this.groups[i].remote == ws.wpath){
            return this.groups[i];
        }
    }
    return null;
};

/* not used:
exports.Policy_checker.prototype.update_group = function (node, group){
    group.nodes.push(node.name);
    node.subscribe(group.function);
};
*/

exports.Policy_checker.prototype.create_group_node = function (group_node_name, ws) {
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
            "node_name": new_group_node_name,
            "action": "forward_all"
        }
    );
    group_node.announce({
        "type": "energys.data"
    });
    return group_node;
};

exports.Policy_checker.prototype.get_nodes_for_group = function (policy, wpath, group_callback, group_entry) {
    var _this = this;
    this.router.node("/").subscribe_announcement(function(node, method, initial) {
        if (!node.hasOwnProperty('group_node')) {
            group_entry.nodes.push(node);

            var this_policy = _this.find_most_relevant_policy(node, wpath, node.get_metadata(), "read");
            if(_.isEqual(policy, this_policy)){
                node.subscribe(group_callback);
            }
        }
    });
};


// the aggregated value is published by the group_node after n values got received
exports.Policy_checker.prototype.create_callback_by_count = function (destination_node, policy, publish_to) {
    var policy_checker = this;
    var values = {};
    var memory = {};
    var interval_start;
    var count = 0;

    // calculates and publishes aggregated value
    function calc_and_publish(node){
        count++;
        if (!(count < policy.action_extra.interval)) {
            // calculates aggregated value
            var result = policy_checker.aggregate_values(policy.action_extra.method, values, memory, interval_start, node.time);
            // saving last value of every node to memory-variable so the integral can be fully calculated
            for (var node_name in values){
                memory[node_name] = values[node_name][values[node_name].length-1]
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
exports.Policy_checker.prototype.create_callback_by_time = function (destination_node, policy, publish_to) {
    var values = {};
    var memory = {};
    var interval_start = new Date().getTime()/1000;
    var interval_end;

    // calculates and publishes aggregated value
    setInterval(function(method, destination_node, policy_checker){
        interval_end = new Date()/1000;
        // calculate
        var result = policy_checker.aggregate_values(method, values, memory, interval_start, interval_end);
        // saving last value of every node to memory-variable so the integral can be fully calculated
        for (var node_name in values){
            memory[node_name] = values[node_name][values[node_name].length-1]
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


exports.Policy_checker.prototype.aggregate_values = function (method, value_group ,memory, interval_start, interval_end) {
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
        if (memory[node] == undefined) {
            value = 0;
        }else{
            value = memory[node].value
        };
        upper_limit = values[0].time;
        lower_limit = interval_start;
        interval = Math.round((upper_limit-lower_limit));
        result += interval * value;
        for (var i = 0; i < values.length-1; i++) {
            value = values[i].value;
            upper_limit = values[i+1].time;
            lower_limit = values[i].time;
            interval = Math.round((upper_limit-lower_limit));
            result += interval * value;
        }
        value = values[values.length-1].value;
        upper_limit = interval_end;
        lower_limit = values[values.length-1].time;
        interval = Math.round((upper_limit-lower_limit));
        result += interval * value;
    }
    return result;
}

// Was tut das round dort?
function calculate_integral_avg(integral, interval_start, interval_end) {
    var timespan = Math.round(interval_end - interval_start);
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
