#!/usr/bin/env node

var EnergyRouter = require("../");
var main = new EnergyRouter();
main.config({
	"app_dir": __dirname+"/"
});

var n = main.node("/test");
n.announce();

var ds = new Date()/1000;
for (var i=0; i<10; i++) {
	n.publish(ds+i, i);
}

var hc = function(topic, exceeded_value) {
	return function(data, exceeded) {
		console.log(topic);
		var de = data.map(function(d) { return d.value; });
		console.log("history", de, exceeded);
		if (exceeded_value !== exceeded) {
			throw new Error("value of exceeded was not expected");
		}
	};
};

n.get_history({}, hc("default: --- exceeding", true));

n.get_history({
	maxentries: 5
}, hc("maxentries:", false));

n.get_history({
	maxentries: 10
}, hc("maxentries:", false));

n.get_history({
	fromtime: ds+4
}, hc("fromtime:", false));

n.get_history({
	fromtime: ds+5-0.01
}, hc("fromtime:", false));

n.get_history({
	totime: ds+5
}, hc("totime: --- exceeding", true));

n.get_history({
	fromtime: ds-5
}, hc("fromtime (over): --- exceeding", true));

n.get_history({
	fromtime: ds+5,
	totime: ds+8
}, hc("from/totime:", false));


