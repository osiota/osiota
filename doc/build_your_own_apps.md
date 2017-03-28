## How build your own apps:
__This tutorial gives you the basic information on how to expand the energy-router(ER) functionality by building you own apps and how to use a config file__

+ _*App:*_
1.	Note: all code should be situated in the gitlab group [https://gitlab.ibr.cs.tu-bs.de/eneff-campus-2020].
2. All apps should be prefixed by “er-app-“
3.	Your app will be started via it’s index.js file. So make sure you have one and that it is the central part of your app
4.	The index.js should have a method header as following:
`exports.init = function(node, app_config, router_config, autoinstall){}`
5.	All the config-data handed to your app is contained in the app_config object. All the attributes carry the same name they were given in the config JSON File. (e.g the example config file given at the end of this tutorial would lead to attributes like IP, passw and node_name. Those attributes can be accessed in the code via app_config.IP .
6.	Furthermore, your init method receives a router-object, which can you used to use the publish, subscribe and announce methods. This can be done via e.g. router_config.router.publish();

+ _config_file:_
The config-JSON-file contains all information your ER needs every time it is started. It contains the Hostname and Port which the ER should use, as well as the connection to other ERs that should be established automatically. Furthermore all apps, their configuration parameters and all policies for the privacy functions are specified here.
For example, a config file could look like the following:
```JSON
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
}
```

Another example config-file can be found be found [here](https://gitlab.ibr.cs.tu-bs.de/eneff-campus-2020/energy-router/blob/development/main_cli_sample_config.json).