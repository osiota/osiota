
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<title>Energieanzeige</title>

		<link rel="stylesheet" href="modal.css">

		<script type="text/javascript" src="bower_components/jquery/dist/jquery.min.js"></script>
		<script type="text/javascript" src="bower_components/jquery-fullscreen/jquery.fullscreen.js"></script>
		<script type="text/javascript" src="jsextend.js"></script>
		<script type="text/javascript" src="pws.js"></script>
		<script type="text/javascript" src="rclient.js"></script>

		<script>
		/**
		 * Request data from the server
		 */
		var ws = null;
		$(function() {
			ws = new rclient();
			ws.event_on("connect", function() {
				$("#connecting").fadeOut(800);
			});
			ws.event_on("disconnect", function() {
				$("#connecting").show();
			});

			ws.bind_hash();

			ws.event_on("data", function(data) {
				var $img = $("#img img");
				if ($img.length == 0) {
					$img = $("<img />");
					$img.appendTo("#img");
				}
				$img.attr("src", data.value);
			});
			ws.init();
		});
		</script>
		<style>
			#input {
				position: fixed;
				border-top: 10px solid rgb(190,30,60);
				bottom: 0px;
				left: 0px;
				width: 100%;
				background-color: white;
				padding: 1em;
			}
			#input input, #input button {
				font-size: 1.2em;
			}
			#chat div {
				margin: 0;
				padding: 0;
			}
			#chat div span {
				padding: 0 0.5em 0 0;
			}
			#chat div span.name {
				color: rgb(190,30,60);
			}
			#chat span.time:before {
				content: "[";
			}
			#chat span.time:after {
				content: "]";
			}
		</style>
	</head>
	<body>
<?php include("tubs_header.php"); ?>
<p class="menu">[ <a href="./">Home</a> - <a href="route.php">Route</a> - <a href="live.php">Live</a> - <a href="ethercat/">EtherCAT-Bus</a> ]</p>
		<h2>Plot</h2>
		<div id="img"></div>
	
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
