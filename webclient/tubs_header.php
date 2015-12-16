<?php

if (!isset($tubs_path)) {
	$tubs_path = "./tubs/";
}

?>

<link rel="stylesheet" href="<?php echo $tubs_path; ?>tubs_cd.css" />
<style>
	html {
		background-color: gray;
		overflow-y: scroll;
	}
	body {
		font-family: sans-serif;
		margin: 0;
		background-color: gray;
	}
	ul {
		list-style-icon: square;
	}
	#main {
		padding-top: 5px;
		margin: 0 10% 0 10%;
		margin: 0 auto;
		background-color: white;
		box-shadow: 0 0 20px 3px #333;
		width: 95%;
		min-width: 980px;
		border-bottom: 8px solid rgb(190,30,60);
	}
	.main_post {
		background: white;
	}
	#main_post:fullscreen {
		margin: 0;
		height: 100vh;
	}

	#header {
		margin: 0;
		padding: 0;
		height: 100px;
		background-color: white;
	}
	#content {
		padding: 0 22px 22px 22px;
		/*background-color: rgb(255,233,170);
		margin: 0 15px 15px 15px;*/
		min-height: 400px;
		margin: 0;
		border-top: 1px solid transparent;
	}
	img.ico {
		float: left;
		margin: -12px 10px -10px 20px;
	}
	#content > h1,
	#content > h2,
	#content > h3
	{
		padding-top: 15px;
	}
	#content > h2.first {
		/*background-color: #606060;
		color: white;*/
		padding: 6px;
		margin-top: 0px;
		margin-bottom: 0;
	}
	.noframe {
		margin-left: -25px;
		margin-right: -25px;
	}
	div.opts {
		margin-bottom: 20px;
		padding: 20px 45px;
		background-color: #f0f0f0;
	}
	.optstk {
		float: right;
		color: #d0d0d0;
		font-weight: normal;
		padding-right: 25px;
	}
	b {
		color: rgb(190, 30, 60);
		font-weight: normal;
	}
	#ifnlogo {
		margin: 25px 20px 0 0;
		width: 230px;
		float: right;
	}
	#iwflogo {
		margin: 5px 50px 0 0;
		width: 370px;
		float: right;
	}
	#tubslogo {
		margin: 45px 0px 0px 0px;
		width: 200px;
		position: absolute;
	}
	#tubsline {
		border-bottom: 3px solid rgb(190,30,60);
		padding: 97px 0 0 200px;
	}
	#ansprechpartner {
		font-size: 0.9em;
		padding: 15px 25px;
		float: right;
		width: 230px;
		background-color: rgb(255, 244, 212);
	}
	#ansprechpartner a {
		color: black;
	}
	.menu {
		float: right;
		margin-top: 15px;
	}
	.menu a {
		color: black;
	}
	#rq_fs {
		position: absolute;
		top: 10px;
		right: 10px;
		font-size: 18px;
		cursor: pointer;
		background-color: rgba(30,30,30,0.2);
		color: rgba(255,255,255,0.4);
		padding: 3px 8px;
		border: 1px solid rgba(255,255,255,0.4);
	}
	#rq_fs:hover {
		background-color: rgba(30,30,30,0.6);
		color: rgba(255,255,255,0.8);
		border: 1px solid rgba(255,255,255,0.8);
	}
</style>
<script>
$(function() {
	$(document).keypress(function(event) {
		if ( event.key == "F11" ) {
			jQuery('#main_post').toggleFullScreen();
			return false;
		}
	});
});
</script>

<div id="rq_fs" onclick="jQuery('#main_post').fullScreen(true);">
⧉
</div>

<div id="main" class="main">
<div id="main_post" class="main_post">
<div id="header">
<a href="http://www.ifn.ing.tu-bs.de/" title="Institut f&uuml;r Nachrichtentechnik"><img src="<?php echo $tubs_path; ?>IfN-Logo_460.png" id="ifnlogo" border="0"/></a>
<a href="http://www.iwf.ing.tu-bs.de/" title="Institut f&uuml;r Werkzeugmaschinen und Fertigungstechnik"><img src="<?php echo $tubs_path; ?>iwf.png" id="iwflogo" border="0"/></a>
<a href="http://www.tu-braunschweig.de/" title="Technische Universit&auml;t Braunschweig"><img src="<?php echo $tubs_path; ?>TUBraunschweig_400.png" id="tubslogo" border="0"/></a>
<div id="tubsline"></div>
</div>

<div id="content">
