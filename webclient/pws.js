

var pWebSocket = function(wpath, func_open, func_message, func_close) {
	this.wpath = wpath;
	this.func_open = func_open;
	this.func_close = func_close;
	this.func_message = func_message;

	this.init();
};
pWebSocket.prototype.init = function() {
	var _pws = this;
	try {
		this.ws = new WebSocket(this.wpath);
		this.ws.state = 1;
		this.ws.onopen = function() {
			_pws.func_open();
		};
		this.ws.onmessage = function(event) {
			//console.log('received: %s', event.data);
			var data = JSON.parse(event.data);

			_pws.func_message(data);
		};
		this.ws.onclose = function() {
			console.log("WebSocket: Connection closed.");
			if (this.state != -1) {
				this.state = -1;
				_pws.need_reconnect();
			}
		};
		this.ws.onerror = function(event) {
			console.log("WebSocket Error: " + event.data);
			if (this.state != -1) {
				this.state = -1;
				_pws.need_reconnect();
			}
		};
	} catch (exception) {
		console.log("Exception: " + exception.name, exception);
		_pws.need_reconnect(3000);
	}
};
pWebSocket.prototype.need_reconnect = function(timeout) {
	if (typeof timeout === "undefined")
		timeout = 1000;

	this.ws = undefined;
	console.log("reconnecting ...");

	if (typeof this.func_close === "function")
		this.func_close();

	var _pws = this;
	setTimeout(function() {
		_pws.init();
	}, timeout);
};
pWebSocket.prototype.sendjson = function(data) {
	if (typeof this.ws !== "undefined" &&
		this.ws.readyState == 1) {
        		this.ws.send(JSON.stringify(data));
	}
	else {
		console.log("Socket not ready. Not send.");
	}
};

