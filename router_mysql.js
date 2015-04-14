
// load from router_mysql_config.js
var mysql_config = {
	host     : 'pul.iwf.ing.tu-bs.de',
	user     : 'exfab',
	password : 'PSprfU6DcMMChWYC',
	database : 'Experimentierfabrik'
};

var mysql      = require('mysql');
var connection = mysql.createConnection(mysql_config);

connection.connect();

var mid = {};


dests.mysql = function(id, name, time, value) {
	
	connection.query('INSERT INTO Data(Measurement_id, Time, Value) VALUES(' + mid + ', ' + time + ', ' + value + ')');
};
