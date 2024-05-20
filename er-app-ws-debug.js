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

patch_callback(wsc.pWebSocket.prototype, "sendjson_raw", function(message) {
	console.log("ws send", message);
});
patch_callback(wsc.pWebSocket.prototype, "recvjson", function(message) {
	console.log("ws recv", message);
});


exports.init = function(node, app_config, main) {

}
