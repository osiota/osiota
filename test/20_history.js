#!/usr/bin/env node

const assert = require('assert').strict;

const osiota = require("../");
const main = new osiota();
main.config({
	"app_dir": __dirname+"/",
	"save_history": false
});

const n = main.node("/test");
n.announce();

const ds = new Date()/1000;
for (var i=0; i<10; i++) {
	n.publish(ds+i, i);
}

const hc = function(topic, exceeded_value, de_value) {
	return function(data, exceeded) {
		console.log(topic);
		var de = data.map(function(d) { return d.value; });
		assert.equal(exceeded, exceeded_value, "exceeded was not as expected");
		assert.deepEqual(de, de_value, "data was not as expected");
		console.log("history", de, exceeded);
	};
};

n.get_history({}, hc("default: --- exceeding", true, [0,1,2,3,4,5,6,7,8,9]));

n.get_history({
	maxentries: 5
}, hc("maxentries:", false, [5,6,7,8,9]));

n.get_history({
	maxentries: 10
}, hc("maxentries:", false, [0,1,2,3,4,5,6,7,8,9]));

n.get_history({
	fromtime: ds+4+0.01
}, hc("fromtime:", false, [5,6,7,8,9])); // 4 not included.

n.get_history({
	fromtime: ds+4
}, hc("fromtime:", false, [5,6,7,8,9])); // 4 not included.

n.get_history({
	fromtime: ds+4-0.01
}, hc("fromtime:", false, [4,5,6,7,8,9])); // 4 included

n.get_history({
	totime: ds+5
}, hc("totime: --- exceeding", true, [0,1,2,3,4])); // 5 not included

n.get_history({
	totime: ds+5+0.01
}, hc("totime: --- exceeding", true, [0,1,2,3,4,5])); // 5 included

n.get_history({
	fromtime: ds+20
}, hc("fromtime: future", false, [])); // empty


n.get_history({
	fromtime: ds-5
}, hc("fromtime (over): --- exceeding", true, [0,1,2,3,4,5,6,7,8,9])); // full

n.get_history({
	totime: ds-5
}, hc("totime: --- exceeding", true, [])); // empty


n.get_history({
	fromtime: ds+5,
	totime: ds+8
}, hc("from/totime:", false, [6,7])); // range, 5 and 8 not included
