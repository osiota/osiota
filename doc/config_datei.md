## Config-Datei
Wichtig für die Konfiguration des so zu startenden ER ist die Konfigurations-Datei.
Diese JSON-Datei Konfiguriert den ER, indem dort Hostname und Port des ER festgelegt werden, sowie die Verbindungen zu anderen ERs. Außerdem werden in der Datei die zu startenden Apps, ihre Konfigurations-Parameter sowie die Policies für die Privatsphären Regelungen konfiguriert. Eine Beispieldatei ist im development branch zu finden:

[https://gitlab.ibr.cs.tu-bs.de/eneff-campus-2020/energy-router/blob/development/main_cli_sample_config.json](https://gitlab.ibr.cs.tu-bs.de/eneff-campus-2020/energy-router/blob/development/main_cli_sample_config.json)

Eine weitere Beispieldatei sieht wie folgt aus:
```{
  "hostname": "Raum112",  
  "server": 8080,
  "remote": [
    {
      "name": "upstream",
      "url": "ws://energyrouter:8082/",
      "secure": "true"
    }
  ],
  "app": [
    {
      "name":"er-app-dlink-smartplug",
      "config":{
      	"ip": "172.24.1.100",
        "passw": "843158",
	"node_name": "/dLinkPlug-1"
      }
    }
 ]
} ```

