## Eigene Apps implementieren 

1.	Eigene Apps, sollten auch in https://gitlab.ibr.cs.tu-bs.de/eneff-campus-2020 liegen.
2.	Ihr name sollte den Präfix er-app- tragen
3.	Die App wird gestartet, indem ihre index.js Datei ausgeführt wird
4.	Diese Index.js Datei sollte also das Kernstück der eigenen App sein und eine Init-Methode mit folgendem Kopf besitzen: exports.init = function(node, app_config, router_config, autoinstall){}
5.	Die Konfigurationsdaten sind in dem app_config Objekt enthalten. Sie können Tragen den Namen wie in der JSON Datei festegelegt. Die obige JSON Datei würde also folgende Parameter liefern, IP, passw, und node_name. Diese sind im Code über das app_config Objekt zu erreichen: app_config.IP
6.	Des Weiteren wird der APP ein router-Objekt übergeben: router_config.router auf diesem dieses Objekt können die publish, sunscribe, und announce Funktionen ausgeführt werden.
