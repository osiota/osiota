3.	Hinweise für die Installation eines ER

Um die Software auf einer geeigneten Umgebung (Linux mit installiertem Node.js, NPM und GIT) zu installieren und zu starten sollte wie folgt vorgegangen werden:
1.	Installation der ER-Software

•	Clonen des GIT-Repos: „git clone https://gitlab.ibr.cs.tu-bs.de/eneff-campus-2020/energy-router“

•	Auswahl des richtigen Branches: Master, oder Development

•	In den neu erzeugten Ordner wechseln und per „npm install“ die benötigten Module installieren

•	Zur installation des Webclients:

  * Installation von Apache2 (per apt-get)
  * sudo npm install -g bower
  * cd webclient
  * bower install
  * Symlink, für Apache auf den Webclient Ordner erstellen

2	erstes Testen

Falls der Master branch verwendet wurde, kann nun der erste Test erfolgen:

  * man starte im energie-router Ordner per : “ node ./router_main_example.js“ den Beispiel-Server
  * nun kann man die Node auslesen, entweder per
  * 1. Webclient: localhost/webclient in einem Browser auf dem Gerät
  * 2. Mit der Beispiel Client Anwendung router_main_client.js 
  * node ./router_main_client.js -l 	  listet alle verfügbaren nodes auf
  * node ./router_main_client.js /random abonniert den random node
  
3	Automatische Start-Möglichkeiten für den ER

	1.	Per Init.d skript
im ordner energy-router/init.d befindet sich ein Skript auf das aus /etc/init.d verlinkt werden kann, dadurch wird der ER beim Systemstart autmatisch gestartet

	2	Per Screen-Session:
Die Software screen, bietet die Möglichkeit, einzelne Konsolensitzungen für mehrere Befehle zu erstellen, und diese im Hintergrund auszuführen. 
