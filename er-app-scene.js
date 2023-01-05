
exports.init = function(node, app_config, main, host_info) {
	/*
	config = {
		"name": "scene",
		"config": {
			"node": "/weißichgeradenicht",
			"filter": [{
				"metadata": {
					"lamp": true
				}
			},{
				"nodes": ["/hallo"],
				"value": 214,
				"rpc": []
			}]
		}
	}
	*/


	/* Eine Gruppe bindet Geräte zusammen. Diese besitzen die
	 * gleichen Arten an Zuständen.
	 */

	let check = function() {
		if (!Object.keys(nodes).length) return null;
		for(var nn in nodes){
			if (nodes.hasOwnProperty(nn)) {
				var n = nodes[nn];
				console.error("  CHECK", nn, n.value, n.expected);
				if (n.value !== n.expected) {
					return false;
				}
			}
		}
		return true;
	};

	var do_check = function() {
		let c = check();
		console.error("CHECK", c);
		node.publish(undefined, c);
	};

	let values = function() {
		//console.error("SUBSCIRBED", this.name, this.value);
		// this = node

		nodes[this.name].value = this.value;

		do_check();
	};

	var nodes = {};
	var filter = this._source.filter(app_config.filter, "announce",
			function(cnode, method, initial, update, fconfig) {
		console.error("ANNOUNCED", cnode.name, fconfig);
		nodes[cnode.name] = {
			node: cnode,
			filter: fconfig,
			expected: (fconfig.value === undefined ?
					true : fconfig.value),
			subscription: cnode.subscribe(values)
		};

		return function() {
			nodes[cnode.name].subscription();
			delete nodes[cnode.name];
			do_check();
		};
	});

	/* Eine Szene mappt Zustände von einem Node auf ein (oder mehrere?)
	 * Node(s).
	 */

	//er-app-group:
	/*
	config = {
		"node": "/Funktionen/Alle Lampen",
		"source": "/Wohnung",
		"filter": {
			"metadata": "lamp.object"
		}
	}
	// subscribe: all, one
	// none, some, all
	*/

	node.announce({
		"type": "scene.function",
		"state": app_config.state,
	});

	node.rpc_set = function(reply, state, time) {
		if (!app_config.state && !state) return;
		for (var nn in nodes){
			if (nodes.hasOwnProperty(nn)) {
				var n = nodes[nn];
				let v = n.filter.value;
				if (typeof v === "undefined") v = true;
				if (!state) {
					let nv = n.filter.unset_value;
					if (typeof nv !== "undefined") {
						v = nv;
					} else {
						v = !v;
					}
				}
				if (v !== null) {
					n.node.rpc("set", v, time);
				}
			}
		}

		//node.publish(time, state);
		reply(null, "ok");
	};

	return [filter, node];
};
