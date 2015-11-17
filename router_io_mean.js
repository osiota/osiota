
/* A module to calc mean values */
exports.init = function(router, basename) {
	
	var meandata = {};
	router.dests.mean = function(id, time, value, name, obj) {
		var timebase = 1;
		if (typeof obj === "number") {
			timebase = obj;
		} else if (typeof obj === "string" && obj.match(/^[0-9.]+$/)) {
			timebase = 1*obj;
		}
		if (!meandata.hasOwnProperty(id)) {
			meandata[id] = {"anz": 0, "sum": 0, "time": 0 };
		}
		if (meandata[id].time == Math.round(time / timebase)) {
			meandata[id].anz++;
			meandata[id].sum += (value*1);
		} else {
			if (meandata[id].anz != 0) {
				var v = meandata[id].sum / meandata[id].anz;
				router.publish(id, meandata[id].time, v);
			}
			meandata[id].time = Math.round(time / timebase);
			meandata[id].sum = 1*value;
			meandata[id].anz = 1;
		}
	};

};
