

var config = require("./config_demo_icce.json");

var config_new = JSON.parse(JSON.stringify(config));

config_new.app.unshift({"name": "hallowelt"});

//config_new.app.splice(3, 1);
config_new.app[3].name = "hallo";

config_new.app.push({"name": "hallowelt"});
config_new.app.push({"name": "hallowelt"});

var merge = require("./helper_merge_data.js").merge;

var m = merge(config.app, config_new.app);
console.log("new", config_new.app);
console.log("NEW", m);

console.log("equal", JSON.stringify(m) == JSON.stringify(config_new.app));
