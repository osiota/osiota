/*
 * patch a websocket to get data rate
 */
function patch_callback(object, function_name, callback) {
	var orig_function = object[function_name];
	object[function_name] = function(...args) {
		callback.apply(this, args);
		return orig_function.apply(this, args);
	};
};

const EventEmitter = require('events');
const wsc = require('./router_websocket_client');
const router = require('./router').router;

const PacketEvent = new EventEmitter();

// Listen: sendjson_raw || respond
patch_callback(wsc.pWebSocket.prototype, "sendjson_raw", function(message) {
	PacketEvent.emit("client.send", message.length);
	//datarate_send += message.length;
});
// Listen: recvjson || router.process_single_message
patch_callback(wsc.pWebSocket.prototype, "recvjson", function(message) {
	PacketEvent.emit("client.recv", message.length);
	//datarate_recv += message.length;
});


exports.init = function(node, app_config, main) {
	var _this = this;

	var interval_stat = 1;
	if (typeof app_config.interval_stat === "number") {
		interval_stat = app_config.interval_stat;
	}

	// init nodes:
	node.announce({
		"type": "packages-count.data"
	});
	var node2 = node.node("send");
	node2.announce({
		"type": "packages-count.data"
	});

	// count packets:
	var datarate_send = 0;
	var datarate_recv = 0;
	var onsend = function(message_length) {
		datarate_send += message_length;
	};
	PacketEvent.on("client.send", onsend);
	var onrecv = function(message_length) {
		datarate_recv += message_length;
	};
	PacketEvent.on("client.recv", onrecv);

	let t = process.hrtime();
	var tid = setInterval(function() {

		var diff = process.hrtime(t);
		var delta = diff[0] * 1e9 + diff[1];

		node.publish(undefined, datarate_recv / delta * 1e9);
		node2.publish(undefined, datarate_send / delta * 1e9);

		datarate_send = 0;
		datarate_recv = 0;
		t = process.hrtime();
	}, interval_stat*1000);

	return [tid, node, node2, function() {
		PacketEvent.removeListener("client.send", onsend);
		PacketEvent.removeListener("client.recv", onrecv);
	}];
}
