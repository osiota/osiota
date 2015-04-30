
/* A module to calc mean values */
exports.init = function(router, basename) {
	
	var meandata = {};
	router.dests.mean = function(id, time, value, ref) {
		var timebase = 1;
		if (ref.hasOwnProperty("timebase")) {
			timebase = ref.timebase;
		}
		if (!meandata.hasOwnProperty(id)) {
			meandata[id] = {"anz": 0, "sum": 0, "time": 0 };
		}
		if (meandata[id].time == Math.round(time / timebase)) {
			meandata[id].anz++;
			meandata[id].sum += value;
		} else {
			if (meandata[id].anz != 0) {
				var v = meandata[id].sum / meandata[id].anz;
				router.route(id, time, v);
			}
			meandata[id].time = Math.round(time / timebase);
			meandata[id].sum = 0;
			meandata[id].anz = 0;
		}
	};

};
