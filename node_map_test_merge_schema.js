
var msp = require("./node_map.js").node_map.prototype.merge_schema_properties;

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

console.log(
	msp(schema_1, schema_2)
);
