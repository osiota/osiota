## How to build your own app:

This tutorial gives you the basic information on how to expand the functionality of osiota by building own apps:

### Step 1: Name

Your app needs a name and a place to live in.

* All apps need to be prefixed by ``osiota-app-``.
* The osiota instance searches apps in its base dir, its parent directory, the local node_modules directory, the current working directory and the parent current working directory. An app can be just a single JavaScript file, i.e. ``osiota-app-example.js`` or a directory with a ``package.json`` file etc. If no main target is defined in this package file, the ``index.js`` file is included.

* Note: Official osiota apps are situated in the [GitHub group osiota](https://github.com/osiota/]). Further applications can be found at [NPM with the search term osiota](https://www.npmjs.com/search?q=osiota).


### Step 2: Implementation


1. The main script file (i.e. ``er-app-example/index.js``) should have a method header as following:
```exports.init = function(node, app_config, main) { /* */ }```
1. All the config-data handed to your app is contained in the ``app_config`` object. All the attributes carry the same name they were given in the config JSON File. (e.g the example config file given at the end of this tutorial would lead to attributes like IP and passwd. Those attributes can be accessed in the code via ```app_config.ip```.
1. Furthermore, your init method receives a node-object, which can you used to publish, subscribe and announce information. This can be done via e.g. ```node.announce({}); node.publish(undefined, "Hallo World");```

```js
exports.inhert = [];

exports.init = function(node, app_config, main, extra) {
	node.announce({
		"type": "my.app"
	});
	node.publish(undefined, 10);

	// return an object with items to be "cleaned":
	return [node];
};

exports.cli = function(args, show_help, main, extra) {
	if (show_help) {
		console.group();
		console.info(
			'  --config [file]  Path to the config file\n' +
			'                 (default: "config.json")\n' +
			'  --name [name]  Name and filename of the service\n' +
		console.groupEnd();
		return;
	}
};
```

See: [application API](API.md#application) and [node API](API.md#node)

### Step 3: Activate your Application

See [configuration guide](doc/configuration.md).
