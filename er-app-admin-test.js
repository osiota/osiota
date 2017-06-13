
var load_schema_apps = require("./er-app-admin.js").load_schema_apps;

load_schema_apps(["./", "../", __dirname+"/", __dirname+"/../",
		__dirname+"/node_modules/"]);
