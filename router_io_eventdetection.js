
exports.init = function(router) {
	router.dests.eventdetection = function(node, relative_name) {
		if (relative_name !== "") return;

		var schwellen = this.obj;

		if (!this.hasOwnProperty("eventdetection")) {
			this.eventdetection = {
				aktivitaet: "",
				timestamp: node.time
			};
		}

		var neue_aktivitaet = "";
		for (var schwelle in schwellen) {
			if (node.value > schwelle) {
				neue_aktivitaet = schwellen[schwelle];
			}
		}
		if (neue_aktivitaet != "") {
			if (this.eventdetection.aktivitaet == "") {
				// neue Event:
				this.eventdetection = {
					timestamp: node.time,
					time: node.time,
					duration_sec: 0,
					running: 1,
					program: neue_aktivitaet,
					energy: 0
				};
			};

			// Ereignislänge neu berechnen:
			this.eventdetection.duration_sec = node.time - this.eventdetection.timestamp;

			// Energie addieren (Länge ermitteln):
			var timestamp_last = this.eventdetection_timestamp_last || (node.time - 1);
			var duration_last = node.time - timestamp_last;
			this.eventdetection.energy += node.value * duration_last;

			// event senden:
			router.node(this.id).publish(node.time, JSON.stringify(this.eventdetection), false, true);
		} else {
			if (this.eventdetection.aktivitaet != "") {
				this.eventdetection.running = 0;
				// event senden:
				router.node(this.id).publish(node.time, JSON.stringify(this.eventdetection));
				// delete event:
				this.eventdetection = {
					aktivitaet: ""
				};
			}
		}
		this.eventdetection_timestamp_last = node.time;
	};
};
