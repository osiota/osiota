
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

	const nodes = {};

	/* Eine Gruppe bindet Geräte zusammen. Diese besitzen die
	 * gleichen Arten an Zuständen.
	 */

	let check = function() {
		if (!Object.keys(nodes).length) return null;
		for(const nn in nodes){
			if (nodes.hasOwnProperty(nn)) {
				const n = nodes[nn];
				//console.error("  CHECK", nn, n.expected, n.node.value, n.expected_value);
				if (!n.filter.ignore_feedback &&
						!n.expected) return false;
			}
		}
		return true;
	};

	const do_check = function() {
		let c = check();
		//console.error("CHECK", c);
		node.publish(undefined, c, true);
	};

	let values = function() {
		//console.error("SUBSCIRBED", this.name, this.value);
		// this = node

		const n = nodes[this.name];
		n.expected = (this.value == n.expected_value ||
				( this.value === null &&
					n.expected_value === false ) );

		do_check();
	};

	const filter = this._target.filter(app_config.target_filter, "announce",
			function(cnode, method, initial, update, fconfig) {
		//console.error("SCENE", cnode.name);

		if (update) return;
		//console.error("ANNOUNCED", cnode.name, fconfig);
		const expected_value = (fconfig.value === undefined ?
					true : fconfig.value);
		const n = {
			node: cnode,
			expected: (cnode.value == expected_value ||
				( cnode.value === null &&
					expected_value === false ) ),
			filter: fconfig,
			expected_value: expected_value,
		};
		nodes[cnode.name] = n;
		let s = null;
		if (!fconfig.ignore_feedback) {
			s = cnode.subscribe(values);
		}

		return [s, function() {
			if (nodes[cnode.name]) {
				//console.error("SCENE/unannounce", cnode.name);
				delete nodes[cnode.name];
				do_check();
			}
		}];
	});

	/* Eine Szene mappt Zustände von einem Node auf ein (oder mehrere?)
	 * Node(s).
	 */

	//er-app-group:
	/*
	config = {
		"node": "/Funktionen/Alle Lampen",
		"target": "/Wohnung",
		"filter": {
			"metadata": "lamp.object"
		}
	}
	// subscribe: all, one
	// none, some, all
	*/

	node.announce([{
		"type": "scene.function",
		"button": true,
		"state": app_config.state,
	}, app_config.metadata]);

	node.rpc_set = function(reply, state, time) {
		if (!app_config.state && !state) return;
		for (const nn in nodes){
			if (nodes.hasOwnProperty(nn)) {
				const n = nodes[nn];
				//console.error("SET", nn, n.name);
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
					//if (v != n.node.value)
						n.node.rpc("set", v, time);
				}
			}
		}

		//node.publish(time, state);
		reply(null, "ok");
	};

	return [filter, node];
};
