
exports.init = function(router) {
	router.dests.eventdetection2 = function(node, relative_name) {
		if (relative_name !== "") return;

		var schwellen = this.obj;

		if (!this.hasOwnProperty("eventdetection2")) {
			this.eventdetection2 = {
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
			if (this.eventdetection2.aktivitaet == "") {
				// neue Event:
				this.eventdetection2 = {
					timestamp: node.time,
					time: node.time,
					duration_sec: 0,
					running: 1,
					program: neue_aktivitaet,
					time_length: 0,
					time_zero: 0,
					energy: 0
				};
			};

			// Ereignislänge neu berechnen:
			this.eventdetection2.duration_sec = node.time - this.eventdetection2.timestamp;

			// Energie addieren (Länge ermitteln):
			var timestamp_last = this.eventdetection2_timestamp_last || (node.time - 1);
			var duration_last = node.time - timestamp_last;
			this.eventdetection2.energy += node.value * duration_last;
			this.eventdetection2.time_length++;
			this.eventdetection2.time_zero = 0;

			// event senden:
			if (this.eventdetection2.time_length > 10) {
				router.publish(this.id, node.time, JSON.stringify(this.eventdetection2), false, true);
			}
		} else {
			if (this.eventdetection2.aktivitaet != "") {
				this.eventdetection2.time_zero++;
				if (this.eventdetection2.time_zero > 3) {
					this.eventdetection2.running = 0;
					// event senden:
					if (this.eventdetection2.time_length > 3) {
						router.publish(this.id, node.time, JSON.stringify(this.eventdetection2));
					}
					// delete event:
					this.eventdetection2 = {
						aktivitaet: ""
					};
				}
			}
		}
		this.eventdetection2_timestamp_last = node.time;
	};
};
