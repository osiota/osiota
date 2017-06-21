
// http://codeforgeek.com/2015/01/nodejs-mysql-tutorial/

var mysql = require('mysql');

exports.init = function(node, app_config, main, host_info) {
	var _this = this;

	app_config.connectionLimit = 100; //important
	app_config.debug = false;
	/* other options:
	 *
	 * host
	 * user
	 * password
	 * database
	 * debug
	 */

	// save active subscriptions
	var subscribes = [];

	// Create Mysql Pool Connection
	var pool = mysql.createPool(app_config);

	// Send a query to keep Connection alive (every 30 seconds)
	setInterval(function() {
		_this.query('SELECT 1');
	}, 30000)

	// initialise cue for inserting data
	this.insertdata = main.router.cue_getter(function(getter) {
		var table = "Data";
		var keys = ["Measurement_id", "Time", "Value"];

		//var sqlq = mysql.format("INSERT INTO ??(??) VALUES ?",
		//[table, keys, data]);
		this.query("INSERT INTO ??(??) VALUES ?", function(err) {
			data = getter(err);
			if (err) return;
			return [table, keys, data];
		});
	});

	// Get measurement names
	this.query('SELECT m.id, CONCAT(s.Name, "/", m.Name) AS node '+
			'FROM Measurement AS m '+
			'LEFT JOIN Station AS s ON m.Station_id = s.id;', [],
			function(rows, fields) {
		rows.forEach(function(row) {
			var entry_id = row.id;

			// subscribe entries
			var s = main._source.node(row.node)
						.subscribe(function() {
				// this = node
				var node = this;

				if (typeof node.value !== "undefined" &&
						node.value !== null) {
					_this.insertdata([entry_id,
						node.time, node.value]);
				}
			});
			subscribes.push(s);
		});
	});

	// unloading ...
	return [
		subscribes,
		function() {
			setImmediate(function() {
				pool.end(function(err) {
					if (err) throw err;

					// all connections in the pool
					// cluster have ended
				});
			});
		}
	];
};


// a simple query function using Mysql Pool Connections
exports.query = function(query, data, callback) {
	this.pool.getConnection(function(err, connection) {
		if (err) {
			if (connection)
				connection.release();
			console.warn("mysql: Error while asking for "+
					"a connection:", err.stack || err);
			if (typeof data === "function") {
				data(err);
			}

			return;
		}
		if (!connection.listeners("error")) {
			connection.on("error", function(err) {
				console.warn("mysql: Error while processing "+
					"query. Error:", err.stack || err);
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
				console.warn("mysql: Error while performing "+
						"query:", err.stack || err);
				return;
			}
			if (typeof callback === "function")
				callback(rows, fields);
		});
	});
};
