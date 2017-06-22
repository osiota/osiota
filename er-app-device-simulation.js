
var create_event = function(name, active) {
	var e = {
		timestamp: new Date()/1000,
		time: new Date()/1000,
		duration_sec: 0,
		running: 1,
		active_state: active,
		program: name,
		energy: 0
	};

	// calculate energy consumption
	
	return e;
}

exports.init = function(node, app_config, main, host_info) {

	var states = {
		"off": {
			"active": false,
			"energy": 0
		},
		"on": {
			"active": true,
			"length": 300,
			"energy": 1950
		}
	};

	node.announce({
		//"type": "eventdetection.analysis"
		"type": "eventdetection.analyse"
	});

	var ev = node.node("../Energieverbrauch");
	ev.announce({
		"type": "energy.data"
	});

	var state = "off";

	var s = states[state];
	var e = create_event(state, 0);
	node.publish(undefined, state);
	ev.publish(undefined, s.energy);

	node.rpc_state = function(reply, new_state) {
		if (typeof states[new_state] !== "object") {
			reply("unknown state.", "Sorry");
			return;
		}
		if (state == new_state)
			return;
		state = new_state;
		var s = states[state];
		var e = create_event(state, s.active);
		node.publish(undefined, e);
		ev.publish(undefined, s.energy);
	};

/*
	var a = main.startup(node, "device-play", {
		"node": "../Energieverbrauch",
		"metadata": {
			"type": "energy.data"
		},
		"filename": "foehn.csv",
		"repeats": 1,
		"interval": 1
	});
*/

	return [node, ev];
}
