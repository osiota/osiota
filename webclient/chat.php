
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


		<script type="text/javascript">
		/**
		 * Request data from the server
		 */
		function print_chat(time, data) {
			try {
				data = JSON.parse(data);
			} catch(e) {}
			var t = new Date(time * 1000).toLocaleDateString('de-DE', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit'
			});

			var $p = $("<div/>");
			$("<span class=\"time\"/>").text(t).appendTo($p);
			$("<span class=\"name\"/>").text(data.name).appendTo($p);
			$("<span class=\"message\"/>").text(data.message).appendTo($p);
			
			$p.appendTo("#chat");
		}
		var ws = null;
		var chatnode = "/chat";
		function load_data() {

			ws = new rclient();
			ws.event_on("connect", function() {
				$("#connecting").fadeOut(800);
			});
			ws.event_on("disconnect", function() {
				$("#connecting").show();
			});

			ws.bind_hash(chatnode);
			ws.event_on("data", function(data) {
				chatnode = data.node;
				if (data.value !== null)
					print_chat(data.time, data.value);
			});
			ws.init();
		}

		$(function() {
			load_data();
			if ($("#name").val() == "") {
				$("#name").focus();
			} else {
				$("#message").focus();
			}

			$("#send").on("click", function() {
				var name = $("#name").val();
				if (name == "") {
					alert("Kein Name angegeben.");
					return;
				}
				var message = $("#message").val();

				ws.data(chatnode, JSON.stringify({name: name, message: message}));
				$("#message").val("");
			});
			$("#message").on("keypress", function(event) {
				if (event.which == 13) {
					event.preventDefault();
					$("#send").trigger("click");
				}
			});
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
		<h2>Chat</h2>
		<div id="chat"></div>

		<div id="input">
			<p style="margin: 0 auto; width: 80%;">
			<input type="text" id="name" placeholder="Name"/>
			<input type="text" id="message" placeholder="Nachricht" style="width: 60%"/><button id="send">ok</button>
			</p>
		</div>

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
