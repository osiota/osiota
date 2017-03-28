# Energy broker

Energy broker is a publish subscribe service written in [Node.js](https://nodejs.org/).

## Concept

Clients can connect to an energy broker server to publish or subscribe data.
On the server the data is handled in nodes. Nodes are addressed by a path seperated by a slash.

Client can be meassurement clients, web clients (web browser), calculation clients and so on.

## Function reference

The following main functions are all located in the file `router.js`.

### Class: router

* `node(name)` - get a node
    * `name` - name of the node (String)
    * returns object of type node.
* `connectArray(nodes)` - connect multiple nodes
    * `nodes` - object with key value entries.
       * key - node name of the source node
       * value - node name of the target node
* `get_nodes(basename)` - get child nodes beneath basename
    * `basename = ""` (String)
* `register_static_dest(name, func, force_name = false)` - Register a static destination
    * `name` - name of the destination (String)
    * `func` - function handler to be called
    * `force_name` - Shall the name be forced? Otherwise a string is appended to the name
    * returns the registered name (with string appended)

For internal use:
* `get_dests()` - get all destinations
    * returns array with names of all destinations
* `get_static_dest(name)` - get the function handler of a destination
    * `name` - name of the destination (String)
    * returns the function handler or `undefined`

### Class: Node

* `publish(time, value, only_if_differ = false, do_not_add_to_history = false)` - set new data and publish it
    * `time` - unix timestamp of the data. If `time` is undefined, the current time is used.
    * `value` - the data
    * `only_if_differ` - do only publish if the data differ (optional, Boolean)
    * `do_not_add_to_history` - do not add the data to the history object (optional, Boolean)
* `connect(dnode)` - connect with a second node. Route data to this node
    * `dnode` - the original node object to route
    * returns a routing entry object.
* `register(dest, id, obj, push_data = true)` - register a module to deal with the node data
    * `dest` - name of the destination
    * `id` - address, nodename, ... (used by the destination module)
    * `obj` - an optional obj.
    * returns a routing entry object.
* `unregister(rentry)` - unregister a registered or connected routing entry
    * `rentry` - a routing entry object, created by `connect` or `register`
* `get_history(interval = null)` - get old data
    * `interval` - object with fields:
        * `maxentries = 3000` - Maximum among of entries.
        * `samplerate = null` - Custom sample rate.
        * `fromtime = null` - unix timestamp of the first data entry (not included)
        * `totime = null` - unix timestamp of the last data entry (not included)

For internal use:
* `set(time, value, only_if_differ = false, do_not_add_to_history = false)` - only set data
    * Options, see `publish`
    * returns true, if data was set.
* `route(node, relative_name = "", do_not_add_to_history = false)` - do the publishing
    * `node` - the original node object to route
    * `relative_name` - relative path node name (relavant when routing data to parent nodes)
    * `do_not_add_to_history` - do not add the data to the history object (optional, Boolean)


## Bindings

### Communication
  - WebSocketServer
  - WebSocketClient

  - MATLAB via WebSockets
  - PHP via WebSockets

### General bindings
  - Child process
  - Exec command (on new data)
  - console, in
  - console, out
  - Random in (create random input data)

### Specific (hardware) bindings
  - USBDMX (Output data to an usbdmx compatible device)
  - Artnet (using npm module artnet)
  - agsBus (fast and bad implementation of a custom protocol simular to modbus)
  - rcswitch (switch rc controlled hardware plugs)

### Data binding
  - MySQL (save in a specific schema)
  - Play back virtual devices (saved in csv files)
  - save data to csv file

### Data processing
  - accumulate (over time)
  - bias
  - eventdetection
  - function
  - mean
  - multiply
  - sum

### Config
  - jsonconnect
  - static routes (see `config_*.js`)

## Helpers
* History: Save data in a seperate history object. Functions:
    * `add(time, value)` - add data to the object
    * `get(interval)` - get history data as array of objects with keys time and value.
        * `interval` - object with fields:
            * `maxentries = 3000` - Maximum among of entries.
            * `samplerate = null` - Custom sample rate.
            * `fromtime = null` - unix timestamp of the first data entry (not included)
            * `totime = null` - unix timestamp of the last data entry (not included)


## How to implement a new binding

### Way one: Own service, pipe data

If you already have an implementation not written in Node.js, you can start this implementation as child process
and pipe the data via the standard input and output streams.
Use the binding childprocess.

Data format (in and out), ending with a newline:
```
/node [time]: value
```
Time is optional:
```
/node: value
```

To get data you have to subscribe it. Use
```
connect /node
```



### Way two

Of cause you can implement your own binding in Node.js.
Create a js file

```javascript
exports.init = function(router, ...) {
	// ...
}
```

and use it in your main file:
```javascript
require('./router_mybinding.js').init(r, ...);
```

To pass data to your system, you have to define a destination for your binding (here called mybinding):
```javascript
exports.init = function(router, ...) {
        var destname = router.register_static_dest("mybinding", function(node) {
		// ...
	});
}
```

If your binding does not have the possibility to get configuration from your system, you can pass nodes to connect to your binding. Use:
```javascript
exports.init = function(router, basename, nodes) {
	// ... (s.o.)
        for (var n in nodes) {
                var interval_address = nodes[n];
                router.node(basename + n + '_s').register(destname, internal_address);
        }
}
```

To publish data to the broker use the function publish in your code:
```javascript
// ...
	router.node(basename+name).publish(time, value);
```



## Installation

Install node.js and npm: https://nodejs.org/

Install nodes modules. Run (in this folder):
```sh
$ npm install
```
If this fails with compiler errors try:
```sh
$ npm install --no-optional
```

[Add the energy-router to init system]{@tutorial init_system}

## First steps

Start a server
```sh
$ node ./router_main_example.js
```

Try to connect the client example:
```sh
$ node ./router_main_client.js -l
[list nodes]
$ node ./router_main_client.js /random
[subscribe node "/random"]
```

## Web client

Connect a webclient.
Visit [TestHost localhost](http://sw.nerdbox.de/ds/c_localhost/) or install the web client yourself:

Install bower (system wide):
```sh
$ sudo npm install -g bower
```
Run (in folder `webclient/`)
```sh
$ bower install
```

Copy or link the webclient directory to htdocs directory of a webserver with PHP support.

## Addional Documentation

* [Websocket protocol]{@tutorial websocket_protocol}

## Copyright notice

This software is supposed to be published as open source.
At the moment all rights are reserved to the Technische Universtität Braunschweig.

Simon Walz, Institut für Nachrichtentechnik
