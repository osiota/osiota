
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<title>Energieanzeige</title>

		<link rel="stylesheet" href="modal.css" />
		<link rel="stylesheet" href="energiecockpit.css" />

		<!-- 1. Add these JavaScript inclusions in the head of your page -->
		<script type="text/javascript" src="bower_components/jquery/dist/jquery.min.js"></script>
		<script type="text/javascript" src="bower_components/jquery-fullscreen/jquery.fullscreen.js"></script>
		<script type="text/javascript" src="jsextend.js"></script>
		<script type="text/javascript" src="pws.js"></script>
		<script type="text/javascript" src="rclient.js"></script>


		<!-- 2. Add the JavaScript to initialize the chart on document ready -->
		<script>
		/**
		 * Request data from the server, add it to the graph and set a timeout to request again
		 */
		var ws = null;
		function load_data() {
			ws = new rclient();
			ws.event_on("connect", function() {
				$("#connecting").fadeOut(800);
			});
			ws.event_on("disconnect", function() {
				$("#connecting").show();
			});
			ws.bind("/ethercat/Assembling/Airflow");
			ws.bind("/ethercat/Assembling/Belt");
			ws.bind("/ethercat/Assembling/Individualiser");
			ws.bind("/ethercat/Assembling/PLC");

			ws.bind("/ethercat/CNC/Airflow");
			ws.bind("/ethercat/CNC/Belt");
			ws.bind("/ethercat/CNC/Exhaust");
			ws.bind("/ethercat/CNC/Individualiser");
			ws.bind("/ethercat/CNC/PLC");

			ws.bind("/ethercat/Compressor/Air_in");
			ws.bind("/ethercat/Compressor/Air_out");
			ws.bind("/ethercat/Compressor/Air_out_Pressure");
			ws.bind("/ethercat/Compressor/Airflow");
			ws.bind("/ethercat/Compressor/Power");
			ws.bind("/ethercat/Compressor/Water_in");
			ws.bind("/ethercat/Compressor/Water_out");
			ws.bind("/ethercat/Compressor/Waterflow");

			ws.bind("/ethercat/DistributionA/Airflow");
			ws.bind("/ethercat/DistributionA/PLC");

			ws.bind("/ethercat/DistributionB/Airflow");
			ws.bind("/ethercat/DistributionB/Belt");
			ws.bind("/ethercat/DistributionB/Individualiser");
			ws.bind("/ethercat/DistributionB/PLC");

			ws.bind("/ethercat/Furnace/Belt1");
			ws.bind("/ethercat/Furnace/Belt2");
			ws.bind("/ethercat/Furnace/Heating");
			ws.bind("/ethercat/Furnace/Individualiser1");
			ws.bind("/ethercat/Furnace/Individualiser2");
			ws.bind("/ethercat/Furnace/PLC");

			ws.bind("/ethercat/Press/Airflow");
			ws.bind("/ethercat/Press/PLC");

			ws.bind("/ethercat/Switch/Airflow");
			ws.bind("/ethercat/Switch/Belt1");
			ws.bind("/ethercat/Switch/Belt2");
			ws.bind("/ethercat/Switch/PLC");

			ws.bind("/ethercat/TransportA/Airflow");
			ws.bind("/ethercat/TransportA/Belt");
			ws.bind("/ethercat/TransportA/PLC");

			ws.bind("/ethercat/TransportB/Airflow");
			ws.bind("/ethercat/TransportB/Belt");
			ws.bind("/ethercat/TransportB/PLC");

			ws.react_namespace("/ethercat/", function(value, $elem) {
				var sma = $elem.data("sma");
				if (typeof sma === "undefined") {
					sma = simple_moving_averager(50);
					$elem.data("sma", sma);
				}
				value = sma(value);
			
				var precession = $elem.attr("data-precession");
				if (typeof precession !== "undefined")
					value = value.toFixed(precession);
				//value = Math.round(value * Math.pow(10,precession)) / Math.pow(10, precession);
				
				return value;
			});
			ws.init();
		}

		$(function() {
			load_data();

			$("#main_post").addClass("blue-20");
			$(".v_energy").addClass("orange-60");
			$(".v_plc").addClass("orange-20");
			$(".v_airflow").addClass("blue-60");
			$(".v_compressedair").addClass("blue-100");
			$(".verbr").addClass("white");

			$(".verbr .value").each(function() {
				$(this).attr("data-name", $(this).attr("id")
					.replace(/^.*\//, "")
					.replace(/_/g, ", ")
					.replace(/(\d+)$/, " ($1)")
				);
			}).on("click", function() {
				window.location.href = "live.php#/ethercat/" + $(this).attr("id");
			});
			$(".verbr").on("click", function() {
				var nodes = $(this).find(".value").map(function() {
					return "/ethercat/"+$(this).attr("id");
				}).get().join(",");
				window.location.href = "live.php#" + nodes;
			});
		});
		</script>
	</head>
	<body>
<?php include("tubs_header.php"); ?>
<p class="menu">[ <a href="./">Home</a> - <a href="route.php">Route</a> - <a href="live.php">Live</a> - <a href="ethercat/">EtherCAT-Bus</a> ]</p>


	<h2>TU Braunschweig, IWF</h2>

    <div class="untergruppe blue-60">
         <h3>Experimentierfabrik</h3>
	 <div class="pre_verbr" style="float: right;"><div class="verbr">
		<div class="header">Compressor</div>
		<div class="value" id="Compressor/Air_in" data-precession="2"></div>
		<div class="value" id="Compressor/Air_out" data-precession="2"></div>
		<div class="value v_compressedair" id="Compressor/Air_out_Pressure" data-precession="2"></div>
		<div class="value v_airflow" id="Compressor/Airflow" data-precession="2"></div>
		<div class="value v_energy" id="Compressor/Power" data-precession="2"></div>
		<div class="value" id="Compressor/Water_in" data-precession="2"></div>
		<div class="value" id="Compressor/Water_out" data-precession="2"></div>
		<div class="value v_waterflow" id="Compressor/Waterflow" data-precession="2"></div>
	 </div></div>
	 <div class="pre_verbr"><div class="verbr">
		<div class="header">Furnace</div>
		<div class="value" id="Furnace/Belt1" data-precession="2"></div>
		<div class="value" id="Furnace/Belt2" data-precession="2"></div>
		<div class="value v_energy" id="Furnace/Heating" data-precession="2"></div>
		<div class="value v_energy" id="Furnace/Individualiser1" data-precession="2"></div>
		<div class="value v_energy" id="Furnace/Individualiser2" data-precession="2"></div>
		<div class="value v_plc" id="Furnace/PLC" data-precession="2"></div>
	 </div></div>
	 <div class="pre_verbr"><div class="verbr">
		<div class="header">CNC</div>
		<div class="value v_airflow" id="CNC/Airflow" data-precession="2"></div>
		<div class="value v_energy" id="CNC/Belt" data-precession="2"></div>
		<div class="value v_energy" id="CNC/Exhaust" data-precession="2"></div>
		<div class="value v_energy" id="CNC/Individualiser" data-precession="2"></div>
		<div class="value v_plc" id="CNC/PLC" data-precession="2"></div>
	 </div></div>
	 <div class="pre_verbr"><div class="verbr">
		<div class="header">Assembling</div>
		<div class="value v_airflow" id="Assembling/Airflow" data-precession="2"></div>
		<div class="value v_energy" id="Assembling/Belt" data-precession="2"></div>
		<div class="value v_energy" id="Assembling/Individualiser" data-precession="2"></div>
		<div class="value v_plc" id="Assembling/PLC" data-precession="2"></div>
	 </div></div>
	 <div class="pre_verbr"><div class="verbr">
		<div class="header">DistributionA</div>
		<div class="value v_airflow" id="DistributionA/Airflow" data-precession="2"></div>
		<div class="value v_plc" id="DistributionA/PLC" data-precession="2"></div>
	 </div></div>
	 <div class="pre_verbr"><div class="verbr">
		<div class="header">DistributionB</div>
		<div class="value v_airflow" id="DistributionB/Airflow" data-precession="2"></div>
		<div class="value v_energy" id="DistributionB/Belt" data-precession="2"></div>
		<div class="value v_energy" id="DistributionB/Individualiser" data-precession="2"></div>
		<div class="value v_plc" id="DistributionB/PLC" data-precession="2"></div>
	 </div></div>
	 <div class="pre_verbr"><div class="verbr">
		<div class="header">Press</div>
		<div class="value v_airflow" id="Press/Airflow" data-precession="2"></div>
		<div class="value v_plc" id="Press/PLC" data-precession="2"></div>
	 </div></div>
	 <div class="pre_verbr"><div class="verbr">
		<div class="header">Switch</div>
		<div class="value v_airflow" id="Switch/Airflow" data-precession="2"></div>
		<div class="value v_energy" id="Switch/Belt1" data-precession="2"></div>
		<div class="value v_energy" id="Switch/Belt2" data-precession="2"></div>
		<div class="value v_plc" id="Switch/PLC" data-precession="2"></div>
	 </div></div>
	 <div class="pre_verbr"><div class="verbr">
		<div class="header">TransportA</div>
		<div class="value v_airflow" id="TransportA/Airflow" data-precession="2"></div>
		<div class="value v_energy" id="TransportA/Belt" data-precession="2"></div>
		<div class="value v_plc" id="TransportA/PLC" data-precession="2"></div>
	 </div></div>
	 <div class="pre_verbr"><div class="verbr">
		<div class="header">TransportB</div>
		<div class="value v_airflow" id="TransportB/Airflow" data-precession="2"></div>
		<div class="value v_energy" id="TransportB/Belt" data-precession="2"></div>
		<div class="value v_plc" id="TransportB/PLC" data-precession="2"></div>
	 </div></div>




	 <br style="clear: both;"/>
	</div>
 
<br style="clear: both;"/>


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
