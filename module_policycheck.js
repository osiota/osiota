/*
 * module policy check
 *
 * This module introduces a security-mechanism to prevent two things:
 *      - it prevents security relevant information from leaving
 *        the routers privacy scope.
 *      - and stops unauthorised manipulation of the routers data.
 *
 * It does this by introducing so called 'policies' and continously checking
 * the websocket-communication from and to a remote router.
 *
 *      - Policies can be added by calling add_policy().
 *      - A Websocket-Connection can be secured by adding it to the
 *        secured_connections-array of the routers Policy_checker-object
 */

const match = require("./helper_match").match;

/*
 * This definition maps a method of an rpc-call to policy actions
 *
 * Methods to be checked when sending an RPC-Call: announce
 * Methods to be checked when receiving an RPC-Call: subscribe, data, announce
 *
 * IMPORTANT, when adding more szenarios for other methods do not forget
 * to add the method to the REACTIONS variable. Because otherwise
 * the policy checker will think that the specific method does not need
 * to be evaluated in the szenario and will not do a full policy check!
 */
const REACTIONS = {
	"from_remote": {
		"announce": {
			"block_write": false,
			"allow_write": true,
			"default": false
		},
		"subscribe": {
			"hide_all": false,
			"hide_value_and_metadata": false,
			"hide_value": false,
			"preprocess_value": function(policy) {
				return policy;
			},
			"forward_all": true,
			"default": false
		},
		"data": {
			"block_write": false,
			"allow_write": true,
			"default": false
		}
	},
	"to_remote": {
		"announce": {
			"hide_all": false,
			"hide_value_and_metadata": function(policy) {
				//remove metadata
				return {
					"reaction_id": "remove_metadata",
					"args": policy.action_extra
				};
			},
			"hide_value": true,
			"preprocess_value": function(policy) {
				if (policy.action == 'preprocess_value') {
					// aggregating data of group of nodes
					if (policy.action_extra
						.hasOwnProperty('group')) {

						// TODO start app?

						throw new Error(
						"Blocked by policy "+
						"management: because of "+
						"preprocess_value");
					}
				}
				return true;
			},
			"forward_all": true,
			"default": false
		}
	}
};


function get_reaction(data_flow, method, policy_action) {
	if (typeof data_flow === "string" &&
			typeof REACTIONS[data_flow] === "object" &&
			typeof method === "string" &&
			typeof REACTIONS[data_flow][method] === "object") {
		return REACTIONS[data_flow][method];
	}
	return null;
};



function map_reaction(reaction, policy_action) {
	if (reaction !== null &&
			typeof reaction === "object" &&
			typeof policy_action === "string") {
		return reaction[policy_action];
	} else {
		return null;
	}
};

function exec_reaction(reaction, policy, remote_id, method) {
	var r = map_reaction(reaction, policy.action);
	if (typeof r === "function") {
		r = r(policy);
	}
	if (r === false) {
		throw new Error("Blocked by policy management: " +
			method + " from remote " + remote_id);
	}

	// Do not block:
	return null;
}

/*
 * Policy_checker contructor
 */
class Policy_checker {
	constructor() {
		this.policy_set = [[], [], []];
		// policySet[2] = user-level
		// policySet[1] = application-level
		// policySet[0] = default-level,

		this.observed_connections = [];
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
	check(node, remote_id, method, data_flow) {
		// is connection observed
		if (this.observed_connections.indexOf(remote_id) <= -1 ) {
			return null;
		}

		var reaction = get_reaction(data_flow, method);

		// Does method need to be evaluated for this data_flow direction
		if (reaction == null) {
			return null;
		}

		var policy = this.find_most_relevant_policy(node, remote_id, reaction);
		return exec_reaction(reaction, policy, remote_id, method);
	};

	add_observed_connection(connection_id) {
		this.observed_connections.push(connection_id);
	};

	remove_observed_connection(connection_id) {
		var array = this.observed_connections;
		var index = array.indexOf(connection_id);
		if (index > -1) {
			array.splice(index, 1);
		}
	};

	add_policy(policy_level, policy) {
		if (typeof policy !== "object" ||
				typeof policy.action !== "string") {
			console.log("Your policy "+ policy.toString() +" is not valid");
			return;
		}
		if (policy_level == 'default_level') {
			this.policy_set[0].push(policy);
		} else if (policy_level == 'application_level') {
			this.policy_set[1].push(policy);
		} else if (policy_level == 'user_level') {
			this.policy_set[2].push(policy);
		} else {
			console.log(policy_level+' is an invalid policy-level! '+
				'Please choose one of the following: ' +
				'default_level, application_level, user_level'
			);
		}
	};


	/* 
	 * Find the relevant policy dependent on the node, remote and metadata
	 *    - node: node-object
	 *    - remote: remote-id like "ws://localhost:8080"
	 *    - policy-type: can be "read" or "write"
	 */
	find_most_relevant_policy(node, remote_id, reaction) {

		var mostRelevantPolicy;
		var mostRelevantMatchscore = [[], [], []];
		for (var x = 2; x >= 0; x--) {
			var policies = this.policy_set[x];
			for (var y = 0; y < policies.length; y++) {
				var policy = policies[y];

				var r = map_reaction(reaction, policy.action);
				if (r) {
					var match = check_if_relevant(policy,
							node, remote_id);
					if (match[0] == true && check_if_more_relevant(
							match[1],
							mostRelevantMatchscore
					)) {
						mostRelevantPolicy = policy;
						mostRelevantMatchscore = match[1];
					}
				}
			}
		}
		if (typeof mostRelevantPolicy != 'undefined') {
			return mostRelevantPolicy;
		}
		//if no matching policy was found
		return 'default';
	};
};
exports.Policy_checker = Policy_checker;


/*
 * Helper for finding out if a method/policy action is classified as a
 * read or write action
 */
function get_type_by_method(data_flow, method) {
	if (typeof data_flow === "string" &&
			typeof REACTIONS[data_flow] === "object" &&
			typeof method === "string" &&
			typeof REACTIONS[data_flow][method] === "object") {
		return true;
	}
	return false;
}

// Policy-related-helper-methods

/*
 * Check if a policy is relevant for a node
 *
 * Checks if the policy is relevant for the respective node-, remote-
 * and metadata-combination and returns a matchScores array.
 *
 * A policy is relevant when the defined values match following criteria:
 *    - the node variable either has to match the policy-node or be a child
 *      node of the policy-node
 *    - the remote variable has to match the policy-remote
 *
 * matchScores[0]:
 * 	=0 equals 'perfect match',
 * 	=1 equals 'directParent',
 * 	>1 equals indirectParent, nothing equals not defined
 *
 * matchScores[1]:
 *  	=0 equals 'perfect match,
 *  	empty equals not defined
 *
 * matchScores[2]:
 * 	=0 all key/value-pairs match,
 * 	>0 some key/value-pairs match,
 * 	empty equals not defined
 */
function check_if_relevant(policy, node, remote_id) {
	var matchScores = [[], [], []];
	if (policy.hasOwnProperty('node') &&
			typeof policy.node === "string") {
		var l = is_parentnode(policy.node, node);
		if (l < 0) {
			return [false, matchScores];
		}
		matchScores[0].push(l, node);
	}
	if (policy.hasOwnProperty('remote') &&
			typeof policy.remote === "string") {
		if (policy.remote != remote_id) {
			return [false, matchScores];
		}
		matchScores[1].push(0);
	}
	if (policy.hasOwnProperty('metadata') &&
			typeof policy.metadata === "object") {
		if (!match(node.metadata, policy.metadata)) {
			return [false, matchScores];
		}
		matchScores[2].push(
			Object.keys(policy.metadata).length
			- Object.keys(node.metadata).length
		);
	}
	return [true, matchScores];
}

/*
 * Checks if a relevant policy fits better then another based on the match score
 */
function check_if_more_relevant(policy_score_array1, policy_score_array2) {
	for (var a = 0; a <= 2; a++) {
		if (policy_score_array1[a].length == 1 &&
				policy_score_array2[a].length == 0)
			return true;
		if (policy_score_array1[a].length == 0 &&
				policy_score_array2[a].length == 1)
			return false;
		if (policy_score_array1[a] < policy_score_array2[a])
			return true;
		if (policy_score_array1[a] > policy_score_array2[a])
			return false;
	}
	return false;
}

/*
 * Checks if the 'parent' is a parent of 'node'
 * 
 * EXAMPLE for parent: ('/IBR/Miklab' , /IBR/Miklab/Lamp.energy)
 * EXAMPLE for parent: ('/IBR , /IBR/Miklab/Lamp.energy)
 */
function is_parentnode(parent, node) {
	if(parent == node.name)
		return 0;
	if (node.parentnode !== null) {
		var r = is_parentnode(parent, node.parentnode);
		if (r >= 0)
			return r+1;
	}
	return -1;
}
