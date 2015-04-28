
// http://codeforgeek.com/2015/01/nodejs-mysql-tutorial/

var mysql = require('mysql');

exports.init = function(router, basename, mysql_config) {
	mysql_config.connectionLimit = 100; //important
	mysql_config.debug = false;

	// Create Mysql Pool Connection:
	exports.pool = mysql.createPool(mysql_config);

	// Send a query to keep Connection alive (every 30 seconds)
	setInterval(function() {
		exports.query('SELECT 1');
	}, 30000)

	// a simple query function using Mysql Pool Connections
	exports.query = function(query, callback) {
		exports.pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
				console.warn("Error in connection database");
				return;
			}
			if (!connection.listeners("error")) {
				connection.on("error", function(err) {
					console.warn("Error in connection database: Error: " + err);
				});
			}
			connection.query(query, function(err, rows, fields) {
				connection.release();
				if (err) {
					console.log('Error while performing Query: ' + err);
				} else {
					if (typeof callback === "function")
						callback(rows, fields);
				}
			});
		});
	};
	// Register MySQL Destination:
	router.dests.mysql = function(id, name, time, value) {
		if (typeof value !== "undefined" && value !== null)
			exports.query('INSERT INTO Data(Measurement_id, Time, Value) VALUES(' + id + ', ' + time + ', ' + value + ')');
	};


	// Get measurement names
	var mid = {};
	exports.query('SELECT m.id, CONCAT(s.Name, "/", m.Name) AS node FROM Measurement AS m LEFT JOIN Station AS s ON m.Station_id = s.id;', function(rows, fields) {
		for(var i=0;i<rows.length;i++) {
			mid[rows[i].node] = rows[i].id;

			var rentry = router.register(basename + "/" + rows[i].node, router.dests.mysql, rows[i].id);
		}
	});

};
