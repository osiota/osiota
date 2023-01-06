const Ajv = require('ajv');

exports.json_validate = function(schema, data) {
	if (!schema.__compiled) {
		var ajv = new Ajv({allErrors: true, strictSchema: false});
		ajv.addKeyword("app_metadata");
		ajv.addKeyword("options");
		schema.__compiled = ajv.compile(schema);
		Object.defineProperty(schema, '__compiled',{enumerable: false});
	}
	return schema.__compiled(data);
	// errors in schema.__compiled.errors
}
