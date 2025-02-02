
const hcf = require("./module_history_class_file");

const node = {
	"name": "s_76B73B/energy"
};

const config = {
	"filename": "0.vdb"
};

const history = new hcf.history(node, config);

history.get({
	"maxentries": -1
}, function(hdata) {
	console.error(JSON.stringify(hdata, null, "\t"));
});
