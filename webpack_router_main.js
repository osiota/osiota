/* Helper file to combine the router into one bundle file via webpack */

const main = require("./main_web.js");
const m = new main("WebClient");

module.exports = m.router;
module.exports.main = m;

