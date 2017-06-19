/*
 * Created by Saskia on 18.08.2016.
 *
 * This module introduces a security-mechanism to prevent two things:
 *      - it prevents security relevant information from leaving
 *        the routers privacy scope.
 *      - and stops unauthorised manipulation of the routers data.
 *
 * It does this by introducing so called 'policies' and continously checking
 * the websocket-communication from and to a remote router.
 *
 *      - Policies can be added by calling addPolicy().
 *      - A Websocket-Connection can be secured by adding it to the
 *        secured_connections-array of the routers Policy_checker-object
 */

var _ = require('underscore');

var v = require('./module_json_validator');
//var Aggregation = require("./module_aggregation.js").aggregation;

/*
 * assigns a policy-action to a policy-type
 */
var TYPE_TO_ACTION = {
    read: ['hide_all', 'hide_value_and_metadata', 'hide_value', 'preprocess_value', 'forward_all'],
    write: ['block_write', 'allow_write']
};

/*
 * assigns the method of an rpc-call to a policy-type depending on where the
 * rpc-call was going to be send to and defines what methods are needed to
 * checked in the respective szenario.
 *
 * Methods to be checked when sending an RPC-Call: announce
 * Methods to be checked when receiving an RPC-Call. subscribe, data, announce
 *
 * IMPORTANT, when adding more szenarios for other methods don't forget
 * to add the method to the TYPE-TO-METHOD variable. Because otherwise
 * the Policy-Checker will think that the specific method doesn't need
 * to be evaluated in the szenario and won't do a full Policy-Check!
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


var REACTIONS = {
	"from_remote": {
		"announce": ["block_write", "default"],
		"subscribe": ["hide_all", "hide_value_and_metadata",
				"hide_value", "default"],
		"data": ["block_write", "default"]
	},
	"to_remote": {
		"announce": ["hide_all", "default"]
	}
};

/*
 * Policy_checker contructor
 */
exports.Policy_checker = function(router) {
	this.policy_set = [[], [], []];
	// policySet[2] = user-level
	// policySet[1] = application-level
	// policySet[0] = default-level,

	this.observed_connections = [];
	this.router = router;

//	this.aggregation = new Aggregation(router, this);
};

/*
 * Checks if the "method" defined in the rpc-call coming from or being send
 * to a remote, is allowed to be executed for the respective node!
 *
 * possible results:
 *   - is allowed: return null
 *   - is not allowed: abort further processing of the rpc-call
 *   - is allowed under certain conditions: return policy
 *
 * Example call 1:
 *  check("/IBR", "localhost:8080", "subscribe_announcement", "from_remote");
 * Example call 2:
 *  check("/TUBS/IBR", "locahlhost:8081", "announce", to remote);
 */
exports.Policy_checker.prototype.check = function (node, remote_id, method,
		data_flow) {
	// is connection observed
	if (this.observed_connections.indexOf(remote_id) <= -1 ) {
		return null;
	}
	var policy_type = get_type_by_method(method, data_flow);
	// does method need to be evaluated for this data_flow-direction
	if (policy_type === null) {
		return null;
	}
	var policy = this.find_most_relevant_policy(node, remote_id,
			node.get_metadata(), policy_type);
	return get_reaction(node, remote_id, method, data_flow, policy);
};

function get_reaction(node, remote_id, method, data_flow, policy) {
	var policy_action = policy.action || policy;
	var policy_action_extra = policy.action_extra || null;

	if (typeof REACTIONS[data_flow] === "object" &&
			typeof REACTIONS[data_flow][method] === "object" &&
			Array.isArray(REACTIONS[data_flow][method]) &&
			REACTIONS[data_flow][method]
				.indexOf(policy_action) > -1) {

		throw new Error("Blocked by policy management: " +
				method + " from remote " + remote_id);
	}

	// special actions:
	if (data_flow == 'from_remote') {
		if (method == 'subscribe') {
			if (policy_action == 'preprocess_value') {
				return policy;
			}
		}
	}
	else if (data_flow == 'to_remote'){
		if (method == 'announce'){
			if (policy_action == 'hide_value_and_metadata') {
				//remove metadata
				return {
					reaction_id : 'remove_metadata',
					args : policy_action_extra
				};
			} else if (policy_action == 'preprocess_value') {
				// aggregating data of group of nodes
				if (policy.action_extra
						.hasOwnProperty('group')) {
					throw new Error("Blocked by policy "+
						"management: because of "+
						"preprocess_value");
				}
			}
		}
	}

	// Do not block:
	return null;
}

exports.Policy_checker.prototype.add_observed_connection = function(
		connection_id) {
	this.observed_connections.push(connection_id);
};

exports.Policy_checker.prototype.remove_observed_connection = function(
		connection_id) {
	var array = this.observed_connections;
	var index = array.indexOf(connection_id);
	if (index > -1) {
		array.splice(index, 1);
	}
};

exports.Policy_checker.prototype.add_policy = function(policy_level, policy) {
	if (is_valid_policy(policy)) {
		if (policy_level == 'default_level') {
			this.policy_set[0].push(policy);
		} else if (policy_level == 'application_level') {
			this.policy_set[1].push(policy);
		} else if (policy_level == 'user_level') {
			this.policy_set[2].push(policy);
		} else {
			console.log(
				policy_level+' is an invalid policy-level! '+
				'Please choose one of the following: ' +
				'default_level, application_level, user_level'
			);
		}
		this.activate_policy(policy_level, policy);
	} else {
		console.log("Your policy "+ policy.toString() +" is not valid");
	}
};

exports.Policy_checker.prototype.activate_policy = function(policy_level,
								policy) {
	/*
	if (policy.action == 'preprocess_value') {
		// aggregating data of group of nodes
		if (policy.action_extra.hasOwnProperty('group')) {
			this.aggregation.activate_policy(policy);
		}
	}
	*/
};

/*returns the relevant policy from the given policies-array dependent on the node, remote, metadata and policy_type
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
            if (TYPE_TO_ACTION[policy_type].indexOf(policies[y].action) > -1) {
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


/*
 * Helper for finding out if a method/policy action is classified as a
 * read or write action
 */
function get_type_by_method(method, data_flow) {
    for (var type in TYPE_TO_METHOD[data_flow]) {
        if (TYPE_TO_METHOD[data_flow][type].indexOf(method) > -1) {
            return type;
        }
    }
    return null;
}

function get_type_by_action(policy_action) {
    for (var type in TYPE_TO_ACTION) {
        if (TYPE_TO_ACTION[type].indexOf(policy_action) > -1) {
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
 checks if the policy is relevant for the respective node-, remote- and metadata-combination
 and returns a matchScores-Array if it is a relevant policy. A policy is relevant when the defined values match
 following criteria:
     - the node-variable either has to match the policy-node or be a child node of the policy-node
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
    if (policy.hasOwnProperty('node')) {
        if (policy.node == node_name || is_parentnode(policy.node, node)) {
            matchScores[0].push(get_parent_level(node.router.node(policy.node),
				    node));
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

