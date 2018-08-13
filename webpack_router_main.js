/* Helper file to combine the router into one bundle file via webpack */

var main = require("./main_web.js");
var m = new main("WebClient");

module.exports = m.router;
module.exports.main = m;

