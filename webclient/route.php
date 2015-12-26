<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<title>Energieanzeige, Route</title>

		<link rel="stylesheet" href="modal.css">

		<!-- 1. Add these JavaScript inclusions in the head of your page -->
		<script type="text/javascript" src="bower_components/jquery/dist/jquery.min.js"></script>
		<script type="text/javascript" src="bower_components/jquery-fullscreen/jquery.fullscreen.js"></script>
		<script type="text/javascript" src="jsextend.js"></script>
		<script type="text/javascript" src="pws.js"></script>
		<script type="text/javascript" src="rclient.js"></script>


		<script type="text/javascript">
		var print_nodeentry = function(d, k) {
			var t = new Date(d.time * 1000).toLocaleDateString('de-DE', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit'
				});
			var $option = $("<li/>").attr("value", k).html("<b>"+k+"</b> ");
			$option.append(" <a href=\"./live.php#"+encodeURI(k)+"\" class=\"live\">live</a>");
			$option.append("<button class=\"route\" data=\""+k+"\">route</button>");
			if (typeof d.value === "string") {
				$option.append("<br/>["+t+" Uhr]: ");
				if (d.value.match(/^data:image\/png/)) {
					$option.append("<a href=\"show_plot.php#"+encodeURI(k)+"\">"+
						"PNG Bild</a>");
				} else {
					$option.append("<code>"+d.value+"</code>");
				}
			}
			else if (typeof d.value !== "undefined" && d.value !== null) {
				$option.append("<br/>");
				if (d.time !== null) $option.append("["+t+" Uhr]: ");
				$option.append("<code>"+d.value+"</code>");
			}

			if (typeof d.listener !== "undefined") {
				for (var l in d.listener) {
					var dl= d.listener[l];
					$option.append("<br/>==&gt; ");
					if (typeof dl.type !== "undefined") {
						if (dl.type == "node") {
							$option.append(dl.dnode);
							$option.append(" ");
							$("<button/>").text("remove")
								.attr("class", "rem")
								.attr("data", k)
								.attr("data-rentry", JSON.stringify(dl))
								.appendTo($option);
						} else if (dl.type == "function") {
							$option.append(dl.dest);
							$option.append(" ["+dl.id+"]");
						}
					}
				}

			}

			if (typeof d.value === "undefined")
				$option.attr("style", "color: gray;");
			else if (d.time > (new Date()/1000)-60)
				$option.attr("style", "color: blue;");

			return $option;
		};

		var ws = null;
		function load_data() {
			ws = new rclient();

			ws.event_on("connect", function() {
				ws.list();
				ws.get_dests();
				$("#connecting").fadeOut(800);
			});
			ws.event_on("disconnect", function() {
				$("#connecting").show();
			});

			ws.event_on("dataset", function(data) {
				$("#nodes").empty();
				list_nodes($("#nodes"), data.data, print_nodeentry);
				$("#dl_dialog_nodes").empty();
				list_nodes($("#dl_dialog_nodes"), data.data, function(d, k) {
					var $o = $("<option/>").attr("value", k).text(k);
					return $o;
				});
			});

			ws.event_on("dests", function(data) {
				$("#dialog_dests").empty();
				data.data.forEach(function(d) {
					var $o = $("<option/>").attr("value", d).text(d);
					$o.appendTo($("#dialog_dests"));
				});
			});
			ws.init();
		}

		var refresh = function() {
			ws.list();
			ws.get_dests();
		};


		$(function() {
			load_data();

			$("#addnode_refresh").on("click", function() {
				refresh();
			});

			$("body").on("click", "button.route", function() {
				var node = $(this).attr("data");

				$("#dialog_nodes").val("/target");
				$("#dialog .node").text(node);
				$("#dialog #dialog_dests_id").val(node);
				$("#dialog #dialog_dests_obj").val("[]");
				$("#dialog").show();
			});
			$("body").on("click", "button.live", function() {
				var node = $(this).attr("data");

				window.location.href = "./#" + node;
			});

			$("body").on("click", "button.dialog_node_ok", function() {
				var node = $("#dialog .node").text();
				var dnode = $("#dialog_nodes").val();
				ws.connect(node, dnode);
				$("#dialog").hide();
				window.setTimeout(refresh, 100);
			});

			$("body").on("click", "button.dialog_dests_ok", function() {
				var node = $("#dialog .node").text();
				var dest = $("#dialog_dests").val();
				var id = $("#dialog_dests_id").val();
				var obj = $("#dialog_dests_obj").val();
				try {
					obj = JSON.parse(obj);
				} catch (e) {}

				ws.register(node, dest, id, obj);
				$("#dialog").hide();
				window.setTimeout(refresh, 100);

			});

			$("body").on("click", "button.dialog_cancel", function() {
				$("#dialog").hide();
			});
			$("body").on("click", "button.rem", function() {
				var node = $(this).attr("data");
				var rentry = $(this).attr("data-rentry");
				try {
					rentry = JSON.parse(rentry);
				} catch(e) {}

				ws.unregister(node, rentry);
				window.setTimeout(refresh, 100);
			});

		});
		</script>
		<style>
		body {
			margin: 0;
			padding: 0;
		}
		#dialog {
			position: fixed;
			width: 100%;
			height: 100%;
			background-color: rgba(0,0,0,0.7);
			top: 0;
			left: 0;

			display: none;
		}
		#dialog_content {
			height: 200px;
			margin: 0 auto 0 auto;
			margin-top: 100px;
			width: 50%;
			background-color: white;
			box-shadow: 0 0 20px rgba(0,0,0,0.9);
		
			padding: 1.5em;
		}
		#dialog_content h1:first-child {
			margin-top: 0;
		}
		#dialog .node {
			font-weight: bold;
		}
		button {
			border: 1px solid gray;
			border-radius: 5px;
		}
		ul#nodes {
			margin: 0; padding: 0;
		}
		ul#nodes li {
			list-style-type: none;
			background-color: #f0f0f0;
			margin: 0 0 2px 0;
			padding: 4px;
			clear: both;
		}
		button.route, a.live {
			display: block;
			float: right;
			margin: 5px;
		}
		#dialog_nodes {
			width: 400px;
		}
		</style>
	</head>
	<body>
<?php include("tubs_header.php"); ?>
<p class="menu">[ <a href="./">Home</a> - <a href="route.php">Route</a> - <a href="live.php">Live</a> - <a href="ethercat/">EtherCAT-Bus</a> ]</p>
		<div id="dialog">
		<div id="dialog_content">
			<h1>Route</h1>

			<p>Node: <span class="node"></span></p>

			<p>Route to node: <input id="dialog_nodes" type="text" list="dl_dialog_nodes" autocomplete="off"/><datalist id="dl_dialog_nodes"></datalist><button class="dialog_node_ok">ok</button></p>

			<p>Route to dest: <select id="dialog_dests"></select>
			ID: <input type="text" id="dialog_dests_id"/>
			Obj: <input type="text" id="dialog_dests_obj"/>
			<button class="dialog_dests_ok">ok</button></p>

			<p><button class="dialog_cancel">Cancel</button></p>
			
		</div>
		</div>
		<h2>Leistungsanzeige</h2>
		<p>
			<div id="live"></div>
		</p>
		<ul id="nodes">
		</ul>
		<p>
			<button id="addnode_refresh">refresh</button>
		</p>

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
