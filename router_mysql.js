var mysql      = require('mysql');

exports.init = function(router, basename, mysql_config) {
	exports.connection = mysql.createConnection(mysql_config);

	exports.connection.connect();

	var mid = {};
	exports.connection.query('SELECT m.id, CONCAT(s.Name, "/", m.Name) AS node FROM Measurement AS m LEFT JOIN Station AS s ON m.Station_id = s.id;', function(err, rows, fields) {
		if (!err) {
			for(var i=0;i<rows.length;i++) {
				mid[rows[i].node] = rows[i].id;

				var ref = router.register(basename + "/" + rows[i].node, {"to": router.dests.mysql, "id": rows[i].id});
			}
		} else {
			console.log('Error while performing Query.');
		}
	});


	router.dests.mysql = function(id, name, time, value) {
//		if (mid.hasOwnProperty(id)) {
//			exports.connection.query('INSERT INTO Data(Measurement_id, Time, Value) VALUES(' + mid[id] + ', ' + time + ', ' + value + ')');
//		}
		exports.connection.query('INSERT INTO Data(Measurement_id, Time, Value) VALUES(' + id + ', ' + time + ', ' + value + ')');
	};
};
