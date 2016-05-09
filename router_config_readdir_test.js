
var r = {};
r.node = function(node) {
	var n = {};
	n.publish = function(time, value) {
		console.log(node + "[" + time + "]: " + value);
	};
	return n;	
};

require("./router_config_readdir.js").init(r, "/base", "../fromme_struktur/");

