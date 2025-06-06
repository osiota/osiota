const Ajv = require('ajv');

exports.json_validate = function(schema, data) {
	if (!schema.__compiled) {
		const ajv = new Ajv({allErrors: true, strictSchema: false});
		ajv.addSchema(Object.values(require("./schemas/all-map.json")));
		ajv.addKeyword("app_metadata");
		ajv.addKeyword("headerTemplate");
		ajv.addKeyword("options");

		schema_copy = JSON.parse(JSON.stringify(schema));
		if (schema_copy.additionalProperties === false) {
			schema_copy.additionalProperties = true;
		}

		schema.__compiled = ajv.compile(schema_copy);
		Object.defineProperty(schema, '__compiled',{enumerable: false});
	}
	const m = schema.__compiled(data);
	if (!m) {
		console.log("data", schema, data);
		console.log("m", m);
		console.log("sce", schema.__compiled.errors);
		return m;
	}
	return m;
	// errors in schema.__compiled.errors
}
