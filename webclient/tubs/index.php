<?php

$title = "Elektroakustik - Mitschnitt";

Header( 'Content-type: text/html; charset=ISO-8859-1' );

?><html>
<head>
	<title><?php echo $title; ?></title>
	<link rel="SHORTCUT ICON" href="favicon.ico" title="favicon" />
	<style>
		html {
			background-color: gray;
		}
		body {
			font-family: sans-serif;
			margin: 0;
		}
		ul {
			list-style-icon: square;
		}
		#main {
			padding-top: 5px;
			margin: 0 10% 0 10%;
			background-color: white;
			border-bottom: 8px solid rgb(190,30,60);
			box-shadow: 0 0 20px 3px #333;
		}
		#content {
			padding: 0 25px 25px 25px;
		}
		img.ico {
			float: left;
			margin: -12px 10px -10px 20px;
		}
		h3 {
			background-color: #606060;
			color: white;
			padding: 6px;
			margin-top: 20px;
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
			margin: 25px 15px 0 0;
			width: 230px;
			float: right;
		}
		#tubslogo {
			margin: 45px 0px 0px 0px;
			width: 200px;
			position: absolute;
		}
		#tubsline {
			border-top: 3px solid rgb(190,30,60);
			margin: 100px 0 0 200px;
			padding-top: 15px;
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
	</style>
</head>

<body>
<div id="main">
<a href="http://www.ifn.ing.tu-bs.de/" title="Institut für Nachrichtentechnik"><img src="IfN-Logo_460.png" id="ifnlogo" border="0"/></a>
<a href="http://www.tu-braunschweig.de/" title="Technische Universität Braunschweig"><img src="TUBraunschweig_400.png" id="tubslogo" border="0"/></a>
<div id="tubsline"></div>

<div id="ansprechpartner"><p>Technische Universität
Braunschweig<br/>
<strong>Institut für Nachrichtentechnik</strong></p>

<p>Schleinitzstraße 22<br/>
38106 Braunschweig<br/>
Deutschland</p>

<p>Dipl.-Ing.<br/>
Simon Walz</p>

<p>Tel. +49 (0) 531 391-2411<br/>
Fax +49 (0) 531 391-5192<br/>
<a href="mailto:walz@ifn.ing.tu-bs.de">walz@ifn.ing.tu-bs.de</a><br/>
<a href="http://www.ifn.ing.tu-bs.de/">www.ifn.ing.tu-bs.de</a></p>

<p>Datum: 31. Januar 2014</p>
</div>

<div id="content">
<h1><?php echo $title; ?></h1>



<p>Mitschnitt der <a href="http://www.ifn.ing.tu-bs.de/edu/ela/">Vorlesung Elektroakustik</a> im WS 2013/2014</p>

<p><b>WEITERGABE OHNE ABSPRACHE UNTERSAGT!</b></p>

<p>Vielen Dank an die Studentin Sanja Damitz für den Mitschnitt.</p>

<p><a href="Elektroakustik_Mitschnitt.zip">Alle Dateien als ZIP-Datei herunterladen</a> (386 MB)</p>

<h2>Einzeldateien</h2>
<ul>
<?php
if ($handle = opendir('.')) {
    /* Das ist der korrekte Weg, ein Verzeichnis zu durchlaufen. */
    while (false !== ($file = readdir($handle))) {
		if (preg_match('/\.mp3$/i', $file)) {
			echo "<li><a href=\"".$file."\">".$file."</a> (".round(filesize($file)/1024/1024)." MB)</li>\n";
		}
    }
    closedir($handle);
}
?>
</ul>


</div>
</div>
</body>
</html>