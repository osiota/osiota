exports.get_ref = function(schema, root) {
	if (schema === null || schema === undefined)
		return schema;
	if (typeof schema['$ref'] === "string") {
		let o = root;
		const path = schema['$ref'].replace(/^#\//, '');
		path.split(/\//).forEach(function(p) {
			//o = exports.get_ref(o, root);
			if (typeof o === "object" &&
				o !== null &&
				o.hasOwnProperty(p) &&
				typeof o[p] === "object" &&
				o[p] !== null) {
				o = o[p];
			} else {
				o = undefined;
			}
		});
		return o;
	}
	return schema;
};

exports.get_deref_all = function(root, schema) {
	schema = exports.get_ref(schema, root);
	if (Array.isArray(schema)) {
		return schema.map(exports.get_deref_all.bind(null, root));
	}
	if (typeof schema === "object" && schema !== null) {
		for (let key in schema) {
			if (schema.hasOwnProperty(key)) {
				schema[key] = exports.get_deref_all(
						root, schema[key]);
			}
		}
	}
	return schema;
};
