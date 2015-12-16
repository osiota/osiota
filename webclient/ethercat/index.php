<!--
    @license
    Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
    This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
    The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
    The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
    Code distributed by Google as part of the polymer project is also
    subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
-->
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, minimum-scale=1.0, initial-scale=1.0, user-scalable=yes">
    <title>EtherCAT bus</title>

    <!-- 1. Load platform support before any code that touches the DOM. -->
    <script src="bower_components/webcomponentsjs/webcomponents.js"></script>
    <!-- 2. Load the component using an HTML Import -->
    <link rel="import" href="bower_components/viz-js/viz-js.html">
    <style>
	svg {
		width: 80%;
		height: auto;
		margin: 0 auto;
		display: block;
		border: 8px solid #f0f0f0;
		padding: 10px;
	}
    </style>
  </head>
<?php

$graph = `/opt/etherlab/bin/ethercat graph 2>&1`;
//$graph = preg_replace("/\n/", " ", $graph);
$graph = preg_replace("/'/", "\"", $graph);
$graph = preg_replace("/rankdir=\"LR\"/", "rankdir=\"TB\"", $graph);
$graph = preg_replace("/node \[fontname=\"Helvetica\"\]/", 'node [fontname="Helvetica",style=filled,color=lightgrey;]', $graph);
$graph = preg_replace("/label=\"MII\"/", 'label="MII",color=red', $graph);

$graph = '

'.$graph;

?>

  <body unresolved>
<?php
$tubs_path = "../tubs/";
include("../tubs_header.php"); ?>
<p class="menu">[ <a href="../">Home</a> - <a href="../route.php">Route</a> - <a href="../live.php">Live</a> - <a href="../ethercat/">EtherCAT-Bus</a>]</p>
	<h2>EtherCAT bus</h2>
	<viz-js dotcontent='<?php echo $graph; ?>' engine="dot"></viz-js>
<?php include("../tubs_footer.php"); ?>
  </body>
</html>
