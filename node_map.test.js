#!/usr/bin/env node

var helper = require("./test/helper_test.js");
var test = helper.test(__filename);

var msp = require("./node_map.js").node_map.prototype.merge_schema_properties;

var gsm = require("./node_map.js").node_map.prototype.get_schema_map

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
