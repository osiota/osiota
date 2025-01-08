#!/usr/bin/env node

const helper = require("./test/helper_test.js");
const test = helper.test(__filename);

const msp = require("./node_map.js").node_map.prototype.merge_schema_properties;
const gsm = require("./node_map.js").node_map.prototype.get_schema_map
const node_map = require("./node_map.js").node_map;

const node_mock = {
	connect_config: function (c) { this._config = c; },
	announce: ()=>{},
	node: (name)=>{
		return {...node_mock, name: name};
	},
	name: "base"
};

test('node_map: No config items given', function(t) {
	t.plan(5);

	var app_config = {
		"map": [],
	};
	var map = new node_map(node_mock, app_config, {
		"map_extra_elements": true
	});
	map.init();

	var n = map.node("Hallo");
	t.deepEqual(n.name, "Hallo");
	t.deepEqual(n._config, { map: 'Hallo', node: 'Hallo' });
	var n2 = map.node("Hi");
	t.deepEqual(n2.name, "Hi");
	t.deepEqual(n2._config, { map: 'Hi', node: 'Hi' });

	t.test('node_map: Mapping with config', function(t) {
		t.plan(2);
		var n = map.node({
			map: "Hi2",
			from_map: true
		});
		t.deepEqual(n.name, "Hi2");
		t.deepEqual(n._config, { map: 'Hi2', node: 'Hi2', 'from_map': true });
	});
});


test('node_map: Just one config item given', function(t) {
	t.plan(3);

	var app_config = {
		"map": [{
			"map": "Hallo",
			"node": "1234",
			"from_config": true
		}],
	};
	var map = new node_map(node_mock, app_config, {
		"map_extra_elements": false
	});
	map.init();

	var n = map.node("Hallo");
	t.deepEqual(n.name, "1234");
	t.deepEqual(n._config, { map: 'Hallo', node: '1234', 'from_config': true });
	// n2 shall not be mapped:
	var n2 = map.node("Hi");
	t.deepEqual(n2, null);
});

test('node_map: Just one config item given - with config', function(t) {
	t.plan(3);

	var app_config = {
		"map": [{
			"map": "Hallo",
			"node": "1234",
			"from_config": true
		}],
	};
	var map = new node_map(node_mock, app_config, {
		"map_extra_elements": false
	});
	map.init();

	var n = map.node({
		map: "Hallo",
		from_map: true
	});
	t.deepEqual(n.name, "1234");
	t.deepEqual(n._config, { map: 'Hallo', node: '1234', 'from_config': true, 'from_map': true});
	// n2 shall not be mapped:
	var n2 = map.node("Hi");
	t.deepEqual(n2, null);
});

test('node_map: No initial mapping', function(t) {
	t.plan(3);

	var app_config = {
		"map": [{
			"map": "Hallo",
			"node": "1234",
			"from_config": true
		}],
	};
	var map = new node_map(node_mock, app_config, {
		"map_extra_elements": false,
		"no_initial_mapping": true
	});
	map.init();

	var n = map.node("Hallo");
	t.deepEqual(n.name, "1234");
	t.deepEqual(n._config, { map: 'Hallo', node: '1234', 'from_config': true });
	var n2 = map.node("Hi");
	t.deepEqual(n2, null);
});

test('node_map: No initial mapping - with config', function(t) {
	t.plan(3);

	var app_config = {
		"map": [{
			"map": "Hallo",
			"node": "1234",
			"from_config": true
		}],
	};
	var map = new node_map(node_mock, app_config, {
		"map_extra_elements": false,
		"no_initial_mapping": true
	});
	map.init();

	var n = map.node({
		map: "Hallo",
		from_map: true
	});
	t.deepEqual(n.name, "1234");
	t.deepEqual(n._config, { map: 'Hallo', node: '1234', 'from_config': true, 'from_map': true });
	// n2 shall not be mapped:
	var n2 = map.node("Hi");
	t.deepEqual(n2, null);
});

test('async call data', function(t) {
	t.plan(1);
	var schema_1 = {
		type: 'object',
		title: 'Mathematical Operations',
		properties: {
			expr: {
				type: 'string',
				title: 'formula'
			}
		},
		required: [ 'expr' ],
		additionalProperties: false
	};

	var schema_2 = {
		type: 'object',
		title: 'Mapping',
		properties: {
			map: {
				type: 'string',
				title: 'MAP'
			}
		},
		required: [ 'map' ],
		additionalProperties: false
	};

	t.deepEqual(
		msp(schema_1, schema_2),
		{
			type: 'object',
			title: 'Mathematical Operations',
			properties: {
				expr: { type: 'string', title: 'formula' },
				map: { type: 'string', title: 'MAP' }
			},
			required: [ 'map', 'expr' ],
			additionalProperties: false
		},
		"data"
	);
});

test('async call data -- with ref', function(t) {
	t.plan(1);

	var schema_2 = {
		type: 'object',
		title: 'Mathematical Operations',
		properties: {
			map: {
				"$ref": "#/definitions/map"
			},
			expr: {
				type: 'string',
				title: 'formula'
			}
		},
		required: [ 'map', 'expr' ],
		additionalProperties: false,
		definitions: {
			map: {
				title: 'MAP',
				type: 'array',
				items: [1, 2]
			}
		}
	};
	var object = {
		"_node": {
			"_schema": schema_2
		}
	};

	t.deepEqual(
		gsm.call(object),
		[1, 2],
		"data"
	);
});
