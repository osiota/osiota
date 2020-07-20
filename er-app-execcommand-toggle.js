exports.inherit = [ "execcommand" ];

exports.default_metadata = {
	"type": "output.state",
	"button": true
};

exports.init = function(node) {
	var ret_obj = this._base.execcommand.init.apply(this, arguments);

	node.rpc_toggle = function(reply, time) {
                return this.rpc_set(reply, this.value ? 0 : 1, time);
        };

	return ret_obj;
};
