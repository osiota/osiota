var WebSocket = require('ws');
WebSocket.prototype.sendjson = function(data) {
        this.send(JSON.stringify(data));
};


function ws_setup(wpath) {

        var ws = new WebSocket(wpath);

        ws.on('open', function() {
                ws.sendjson({command: "register", node: "/Engel/Energie_P1"});
		ws.sendjson({command: "register", node: "/Geraet_2/Energie"});
                //ws.sendjson({type: "send_to", actor: 1, message: "Knopf gedrueckt."})
        });
        ws.on('message', function(message) {
                console.log('received: %s', message);
        });
        ws.on('close', function() {
                /* try to reconnect: Use  */
                ws.emit("need_reconnect");
        });
        ws.on('error', function() {
                ws.emit("need_reconnect");
        });
        ws.on('need_reconnect', function() {
                ws = null;
                setTimeout(function(wpath) {
                        ws = ws_setup(wpath);
                }, 1000, wpath);
        });

        return ws;
}

ws_setup('ws://localhost:8080/');

