
exports.init = function(router, node, target, schwellen) {
	console.warn("using router_io_eventdetection: "+
			"This module is deprecated.\n"+
			"please use er-app-analysis/eventdetecion");
	return node.subscribe_h(function() {
		if (!node.hasOwnProperty("eventdetection")) {
			node.eventdetection = {
				program: "",
				timestamp: this.time
			};
		}

		var neue_aktivitaet = "";
		for (var schwelle in schwellen) {
			if (this.value > schwelle) {
				neue_aktivitaet = schwellen[schwelle];
			}
		}
		if (neue_aktivitaet != "") {
			if (node.eventdetection.program == "") {
				// neue Event:
				node.eventdetection = {
					timestamp: this.time,
					time: this.time,
					duration_sec: 0,
					running: 1,
					program: neue_aktivitaet,
					energy: 0
				};
			};

			// Ereignislänge neu berechnen:
			node.eventdetection.duration_sec = this.time - node.eventdetection.timestamp;

			// Energie addieren (Länge ermitteln):
			var timestamp_last = node.eventdetection_timestamp_last || (this.time - 1);
			var duration_last = this.time - timestamp_last;
			node.eventdetection.energy += this.value * duration_last;

			// event senden:
			router.node(target).publish(this.time, node.eventdetection, false, true);
		} else {
			if (node.eventdetection.program != "") {
				node.eventdetection.running = 0;
				// event senden:
				router.node(target).publish(this.time, node.eventdetection);
				// delete event:
				node.eventdetection = {
					program: ""
				};
			}
		}
		node.eventdetection_timestamp_last = this.time;
	}, 15*1000);
};
