
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
		if (typeof data === "undefined") data = [];
		exports.pool.getConnection(function(err, connection) {
			if (err) {
				if (connection)
					connection.release();
				console.warn("mysql: Error while asking for a connection:", err);
				return;
			}
			if (!connection.listeners("error")) {
				connection.on("error", function(err) {
					console.warn("mysql: Error while processing query. Error:", err);
				});
			}
			connection.query(query, data, function(err, rows, fields) {
				connection.release();
				if (err) {
					console.log('mysql: Error while performing query:', err);
					return;
				}
				if (typeof callback === "function")
					callback(rows, fields);
			});
		});
	};
	exports.insertdata = router.cue(function(data) {
		var table = "Data";
		var keys = ["Measurement_id", "Time", "Value"];
		//var sqlq = mysql.format("INSERT INTO ??(??) VALUES ?", [table, keys, data]);
		//console.log("Query: ", sqlq);
		exports.query("INSERT INTO ??(??) VALUES ?", [table, keys, data]);
	});
	// Register MySQL Destination:
	var module_name = router.register_static_dest("mysql", function(node, relative_name, do_not_add_to_history) {
		// this = rentry
		if (typeof node.value !== "undefined" && node.value !== null)
			exports.insertdata([this.id, node.time, node.value]);
			//exports.query('INSERT INTO Data(Measurement_id, Time, Value) VALUES(' + id + ', ' + time + ', ' + value + ')');
	});


	// Get measurement names
	var mid = {};
	exports.query('SELECT m.id, CONCAT(s.Name, "/", m.Name) AS node FROM Measurement AS m LEFT JOIN Station AS s ON m.Station_id = s.id;', [], function(rows, fields) {
		for(var i=0;i<rows.length;i++) {
			mid[rows[i].node] = rows[i].id;

			var rentry = router.node(basename + "/" + rows[i].node).register(module_name, rows[i].id);
		}
	});

};
