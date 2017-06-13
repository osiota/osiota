
var load_schema_apps = require("./er-app-admin.js").load_schema_apps;

var s = load_schema_apps(["./", "../", __dirname+"/", __dirname+"/../",
		__dirname+"/node_modules/"]);

console.log("schema", JSON.stringify(s, undefined, "  "));
