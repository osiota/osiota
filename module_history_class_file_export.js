
var hcf = require("./module_history_class_file");

var node = {
	"name": "s_76B73B/energy"
};

var config = {
	"filename": "0.vdb"
};

var history = new hcf.history(node, config);

history.get({
	"maxentries": -1
}, function(hdata) {
	console.log(JSON.stringify(hdata));
});
