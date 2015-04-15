
// http://codeforgeek.com/2015/01/nodejs-mysql-tutorial/

var mysql = require('mysql');

exports.init = function(router, basename, mysql_config) {
	mysql_config.connectionLimit = 100; //important
	mysql_config.debug = false;

	exports.pool = mysql.createPool(mysql_config);

	var mid = {};
	exports.pool.getConnection(function(err, connection) {
		if (err) {
			connection.release();
			console.warn("Error in connection database");
			return;
		}

		connection.query('SELECT m.id, CONCAT(s.Name, "/", m.Name) AS node FROM Measurement AS m LEFT JOIN Station AS s ON m.Station_id = s.id;', function(err, rows, fields) {
			if (!err) {
				for(var i=0;i<rows.length;i++) {
					mid[rows[i].node] = rows[i].id;

					var ref = router.register(basename + "/" + rows[i].node, {"to": router.dests.mysql, "id": rows[i].id});
				}
			} else {
				console.log('Error while performing Query: ' + err);
			}
		});
		connection.on("error", function(err) {
			console.warn("Error in connection database: Error: " + err);
		});
	});


	router.dests.mysql = function(id, name, time, value) {
		exports.pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
				console.warn("Error in connection database");
				return;
			}

			connection.query('INSERT INTO Data(Measurement_id, Time, Value) VALUES(' + id + ', ' + time + ', ' + value + ')', function(err, rows) {
				connection.release();
			});
			connection.on("error", function(err) {
				console.warn("Error in connection database: Error: " + err);
			});
		});
	};
};
