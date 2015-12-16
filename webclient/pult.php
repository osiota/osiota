<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<title>Energieanzeige</title>

		<link rel="stylesheet" href="modal.css">

		<script type="text/javascript" src="bower_components/jquery/dist/jquery.min.js"></script>
		<script type="text/javascript" src="bower_components/jquery-fullscreen/jquery.fullscreen.js"></script>
		<script type="text/javascript" src="bower_components/nouislider/distribute/nouislider.js"></script>
		<script type="text/javascript" src="jsextend.js"></script>
		<script type="text/javascript" src="pws.js"></script>
		<script type="text/javascript" src="rclient.js"></script>

		<script type="text/javascript" src="mediaelements/mea.js"></script>
		<script type="text/javascript" src="mediaelements/mea_ws.js"></script>
		<script type="text/javascript" src="mediaelements/button.js"></script>
		<script type="text/javascript" src="mediaelements/slider.js"></script>
		<link rel="stylesheet" href="mediaelements/mea.css"/>
		<link rel="stylesheet" href="mediaelements/nouislider-user.css"/>

		<script>
		var ws = null;
		function load_data() {
			ws = new rclient();
			ws.event_on("connect", function() {
				$("#connecting").fadeOut(800);
			});
			ws.event_on("disconnect", function() {
				$("#connecting").show();
			});

			ws.react_event();

			channels = [
				"A-1",
				"A-3",
				"B-1",
				"B-3",
				"C-1",
				"C-3",
				"D-1",
				"D-3",
				"E-1",
				"E-3",
				"F-1",
				"F-3",
				"G-1",
				"G-3",
				"H-1",
				"H-3",
				"I-1",
				"I-3",
				"K-1",
				"K-3",
				"L-1",
				"L-3",
				"M-1",
				"M-3"
			];
			mea.ws = ws;
			for (var c=0; c<channels.length; c++) {
				mea.create(jQuery("#me_main")[0], "slider", "/artnet/" + channels[c]);
			}
			
			ws.init();
		}

		$(document).ready(function() {

			load_data();

		});
		</script>
		<style>
		#me_main * {
			float: left;
		}
		</style>
	</head>
	<body>
<?php include("tubs_header.php"); ?>
<p class="menu">[ <a href="./">Home</a> - <a href="route.php">Route</a> - <a href="live.php">Live</a> - <a href="ethercat/">EtherCAT-Bus</a> ]</p>
		<h2>Lichtpult</h2>

<div id="me_main">

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
