## How build your own apps:
__This tutorial gives you the basic information on how to expand the energy-router(ER) functionality by building you own apps and how to use a config file__

### Step 1: Name

Your app needs a name and a place to live in.

* All apps need to be prefixed by “er-app-“.
* The ER instance searches apps in its base dir, its parent dir and the local node_modules dir. An app can be just a single JS file, i.e. ``./er-app-example.js`` or a full directory with ``package.json`` file etc. If no main target is defined in this package file, the ``index.js`` file is included.

* Note: Official ER apps should be situated in the [gitlab group](https://gitlab.ibr.cs.tu-bs.de/eneff-campus-2020]). In this way applications can be installed automatically, if activated.


### Step 2: Implementation


1. The main script file (i.e. ``er-app-example/index.js``) should have a method header as following:
```exports.init = function(node, app_config, main, host_info) { /* */ }```
1. All the config-data handed to your app is contained in the app_config object. All the attributes carry the same name they were given in the config JSON File. (e.g the example config file given at the end of this tutorial would lead to attributes like IP, passwd and node_name. Those attributes can be accessed in the code via ```app_config.IP```.
1. Furthermore, your init method receives a router-object, which can you used to use the publish, subscribe and announce methods. This can be done via e.g. ```main.node("/name").publish();```


### Step 3: Activate your Application

See [CONFIGURATION](configuration.md).
