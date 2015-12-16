
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<title>Energieanzeige</title>

		<link rel="stylesheet" href="modal.css">

		<!-- 1. Add these JavaScript inclusions in the head of your page -->
		<script type="text/javascript" src="bower_components/jquery/dist/jquery.min.js"></script>
		<script type="text/javascript" src="bower_components/jquery-fullscreen/jquery.fullscreen.js"></script>
		<script type="text/javascript" src="bower_components/highcharts-release/highcharts.js"></script>
		<script type="text/javascript" src="bower_components/highcharts-release/highcharts-more.js"></script>
		<script type="text/javascript" src="jsextend.js"></script>
		<script type="text/javascript" src="pws.js"></script>
		<script type="text/javascript" src="rclient.js"></script>


		<!-- 2. Add the JavaScript to initialize the chart on document ready -->
		<script>
		/**
		 * Request data from the server, add it to the graph and set a timeout to request again
		 */
		var last_time = 0;
		var addtext = function(chart, time, text) {
			if (time === null || text === null)
				return;

			time = Math.round(time*1000);

			// add to point to the series:
			var redraw = true;
			var shift = false;
			var point = {
				'x': time,
				'title': text,
				'text': text
			};
			chart.xAxis[0].addPlotLine({
				'color': 'red',
				'label': {
					'rotation': 90,
					'text': text,
					'verticalAlign': 'top'
				},
				'value': time,
				'width': 1
			});
		};

		var addpoint = function(series, time, value, force_noredraw) {
			if (time === null || value === null)
				return;

			time = Math.round(time*1000);
			value = value*1;

			var time_round = Math.round(time/100)/10;


			// do only redraw if time changed:
			var redraw = false;
			if (last_time != time_round) {
				redraw = true;
				last_time = time_round;
			}
			if (typeof force_noredraw !== "undefined" && force_noredraw) {
				redraw = false;
			}

			// shift data if more than 3000 points:
			var shift = false;
			var values = series.data.length;
			if (values > 3000)
				shift = true;

			// add to point to the series:
			series.addPoint([time, value], redraw, shift, false);

			if (redraw && value < 0) {
				series.yAxis.update({min: null});
			}

			if (redraw)
				get_fps(series);
		};
		var get_fps = function(series) {
			var first_time = (series.data[0].x/1000);
			var values = series.data.length;
			var time = (series.data[values-1].x/1000);
			if (time - first_time > 0) {
				$("#live").text("FPS: " + Math.round(
					(values) / (time - first_time)
					*100)/100);
			}
		};
		var addpoint2 = function(chart, point) {
			if (point[0] != 0) {
				point[0] = Math.round(point[0]*1000);
				point[1] = point[1]*1;

				var time = Math.round(point[0]/100);

				$("#live").text(point[1] + " Watt");
			}
		};
		var registered = {};
		var ws = null;
		function load_data() {
			var chart = this;

			ws = new rclient();
			ws.event_on("connect", function() {
				$("#connecting").fadeOut(800);
			});
			ws.event_on("disconnect", function() {
				$("#connecting").show();
			});

			ws.bind_hash();
			ws.event_on("data", function(data) {
				if (typeof data.add_history !== "undefined" && data.add_history)
					return;
				if (typeof data.value !== "number" && data.value !== null) {
					addtext(chart, data.time, data.value.toString());
					return;
				}
				if (!registered.hasOwnProperty(data.node)) {
					var einheit = "Leistung in W";
					if (data.node.match('_current$'))
						einheit = "Ampere";
					if (data.node.match('_voltage$'))
						einheit = "Volt";
					if (data.node.match('Airflow$'))
						einheit = "Volumenstrom in Nl/min";
					if (data.node.match('Pressure$'))
						einheit = "Druck in bar (abs)";
					if (!chart.get('axis-'+einheit)) {
						chart.addAxis({ // Secondary yAxis
							id: 'axis-'+einheit,
							minPadding: 0.2,
							maxPadding: 0.2,
							min: 0,
							title: {
								text: einheit,
							}
						});
					}
					registered[data.node] = chart.addSeries({
						name: data.node,
						marker: {
							enabled: false
						},
						yAxis: 'axis-'+einheit,
						enableMouseTracking: false,
						data: []
					}, false);

					ws.get_history(data.node, -3000);
				}
				addpoint(registered[data.node], data.time, data.value);
			});
			ws.event_on("history", function(data) {
				console.log("history, begin");

				data.data.forEach(function(d) {
					addpoint(registered[data.node], d.time, d.value, true);
				});
				chart.redraw();

				console.log("history, end");
			});
			ws.event_on("dataset", function(data) {
				list_nodes($("#addnode"), data.data, function(d, k) {
					var $option = $("<option/>").attr("value", k).text(k);
					if (typeof d.value === "undefined")
						$option.attr("style", "color: gray;");
					else if (d.time > (new Date()/1000)-60)
						$option.attr("style", "color: blue;");

					return $option;
				});
			});

			ws.init();
		}

		$(function() {
			Highcharts.setOptions({
				global: {
					useUTC: false
				}
			});

			var chart = new Highcharts.Chart({
				chart: {
					renderTo: 'container',
					defaultSeriesType: 'line',
					animation: false,
					backgroundColor: "transparent",
					events: {
						load: load_data
					}
				},
				title: {
					text: ''
				},
				xAxis: {
					type: 'datetime',
					/*labels: {
						enabled: false
					},*/
					tickPixelInterval: 150,
					maxZoom: 20 * 1000
				},
				yAxis: [
				],
				plotOptions: {
					line: {
						animation: false
					}
				},
				series: [
				]
			});

			$("#reset").on("click", function() {
				values = 0;
				last_time = 0;
			});

			$("#addnode_ok").on("click", function() {
				var node = $("#addnode").val();
				if (typeof node !== "undefined" && node != "" && ws !== null) {
					ws.bind(node);
				}
			});
			$("#addnode_refresh").on("click", function() {
				ws.list();
			});

		});
		</script>
	</head>
	<body>
<?php include("tubs_header.php"); ?>
<p class="menu">[ <a href="./">Home</a> - <a href="route.php">Route</a> - <a href="live.php">Live</a> - <a href="ethercat/">EtherCAT-Bus</a> ]</p>
		<h2>Leistungsanzeige</h2>
		<p>
			<b>Add node:</b>
			<select id="addnode"></select>
			<button id="addnode_ok">ok</button>
			&nbsp;
			<button id="addnode_refresh">refresh</button>
		</p>
		<div id="live" style="position: relative; right: 0; z-index: 999; text-align: right; color: gray;"></div>


		<!-- 3. Add the container -->
		<div id="container" style="width: 100%; height: 600px; margin: 0 auto"></div>

<div class="overlay" id="connecting">
	<div class="modal">
		<h2>Verbindungsaufbau ...</h2>
		<p>Bitte haben Sie etwas Geduld.</p>
		<p>Wird die Verbindung nicht aufgebaut, überprüfen Sie
		bitte ihre Internet-Verbindung.</p>
	</div>
</div>

<?php include("tubs_footer.php"); ?>
	</body>
</html>
