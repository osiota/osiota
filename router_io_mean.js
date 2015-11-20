
/* A module to calc mean values */
exports.init = function(router, basename) {
	
	var meandata = {};
	router.dests.mean = function(node, relative_name) {
		if (relative_name !== "") return;

		var timebase = 1;
		if (typeof this.obj === "number") {
			timebase = this.obj;
		} else if (typeof this.obj === "string" && this.obj.match(/^[0-9.]+$/)) {
			timebase = 1*this.obj;
		}
		if (!meandata.hasOwnProperty(this.id)) {
			meandata[this.id] = {"anz": 0, "sum": 0, "time": 0 };
		}
		if (meandata[this.id].time == Math.round(node.time / timebase)) {
			meandata[this.id].anz++;
			meandata[this.id].sum += (node.value*1);
		} else {
			if (meandata[this.id].anz != 0) {
				var v = meandata[this.id].sum / meandata[this.id].anz;
				router.publish(this.id, meandata[this.id].time, v);
			}
			meandata[this.id].time = Math.round(node.time / timebase);
			meandata[this.id].sum = 1*node.value;
			meandata[this.id].anz = 1;
		}
	};

};
