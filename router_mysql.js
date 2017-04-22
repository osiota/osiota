
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
	exports.query = function(query, data, callback) {
		exports.pool.getConnection(function(err, connection) {
			if (err) {
				if (connection)
					connection.release();
				console.warn("mysql: Error while asking for a connection:", err);
				if (typeof data === "function") {
					data(err);
				}

				return;
			}
			if (!connection.listeners("error")) {
				connection.on("error", function(err) {
					console.warn("mysql: Error while processing query. Error:", err);
					connection.release();
				});
			}
			if (typeof data === "function") {
				data = data(false);
			}
			if (typeof data === "undefined") data = [];
			connection.query(query, data, function(err, rows, fields) {
				connection.release();
				if (err) {
					console.warn('mysql: Error while performing query:', err);
					return;
				}
				if (typeof callback === "function")
					callback(rows, fields);
			});
		});
	};
	exports.insertdata = router.cue_getter(function(getter) {
		var table = "Data";
		var keys = ["Measurement_id", "Time", "Value"];

		//var sqlq = mysql.format("INSERT INTO ??(??) VALUES ?", [table, keys, data]);
		exports.query("INSERT INTO ??(??) VALUES ?", function(err) {
			data = getter(err);
			if (err) return;
			return [table, keys, data];
		});
	});

	// Get measurement names
	exports.query('SELECT m.id, CONCAT(s.Name, "/", m.Name) AS node FROM Measurement AS m LEFT JOIN Station AS s ON m.Station_id = s.id;', [], function(rows, fields) {
		rows.forEach(function(row) {
			var entry_id = row.id;
			router.node(basename + "/" + row.node).subscribe(function() {
				// this = node
				var node = this;

				if (typeof node.value !== "undefined" && node.value !== null) {
					exports.insertdata([entry_id, node.time, node.value]);
					//exports.query('INSERT INTO Data(Measurement_id, Time, Value) VALUES(' + id + ', ' + time + ', ' + value + ')');
				}
			});
		});
	});
};
