
/* Test cases:
 *  * Throughput (kbps)
 *  * Latency (ms)
 *  * Packets Dropped (%)
 */

exports.init = function(node, app_config, main, host_info) {

	// add ping function:
	node.rpc_ping = function(reply, message) {
		//console.log("ping reply");
		reply(null, message);
	};

	node.announce({
		"type": "rtt.rpc"
	});

	return [node];
};
