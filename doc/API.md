<!--

Auto generated documentation:
  * Use jsdoc comments and
  * Run npm run doc

-->
## Classes

<dl>
<dt><a href="#main">main</a></dt>
<dd><p>Remote Process Instance</p>
</dd>
<dt><a href="#node">node</a></dt>
<dd><p>Node class</p>
</dd>
<dt><a href="#router">router</a></dt>
<dd><p>Router class</p>
</dd>
<dt><a href="#remotecall">remotecall</a></dt>
<dd><p>Remote Call class</p>
</dd>
<dt><a href="#node_map">node_map</a></dt>
<dd><p>Node-Map class</p>
</dd>
<dt><a href="#application">application</a></dt>
<dd><p>Application class</p>
</dd>
<dt><a href="#application_manager">application_manager</a></dt>
<dd><p>Application Manager class</p>
</dd>
</dl>

<a name="main"></a>

## main
Remote Process Instance

**Kind**: global class  

* [main](#main)
    * [new main(router_name)](#new_main_new)
    * [.config(config)](#main+config)
    * [.sub_config(config, node, callback)](#main+sub_config)
    * *[.require(appname, callback)](#main+require)*
    * *[.load_schema(appname, callback)](#main+load_schema)*
    * [.close()](#main+close)
    * [.reload(callback)](#main+reload)
    * ["started"](#main+event_started)
    * ["app_loading_error" (error, node, app, app_config, extra, auto_install)](#main+event_app_loading_error)
    * ["app_init" (application)](#main+event_app_init)
    * ["app_added" (application, application_id)](#main+event_app_added)

<a name="new_main_new"></a>

### new main(router_name)
Main Process Instance


| Param | Type | Description |
| --- | --- | --- |
| router_name | <code>string</code> | Name of the instance |

**Example**  
```js
// create a new instance:
var m = new main("my osiota");
```
<a name="main+config"></a>

### main.config(config)
Load a configuration

**Kind**: instance method of [<code>main</code>](#main)  
**Emits**: [<code>started</code>](#main+event_started)  

| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | Configuration |

<a name="main+sub_config"></a>

### main.sub\_config(config, node, callback)
Load sub configurations

**Kind**: instance method of [<code>main</code>](#main)  

| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | Configuration |
| node | [<code>node</code>](#node) | Parent node |
| callback | <code>function</code> |  |

<a name="main+require"></a>

### *main.require(appname, callback)*
Require Module

**Kind**: instance abstract method of [<code>main</code>](#main)  

| Param | Type | Description |
| --- | --- | --- |
| appname | <code>string</code> | Application name |
| callback | <code>function</code> |  |

<a name="main+load_schema"></a>

### *main.load\_schema(appname, callback)*
Load schema file

**Kind**: instance abstract method of [<code>main</code>](#main)  

| Param | Type | Description |
| --- | --- | --- |
| appname | <code>string</code> | Application name |
| callback | <code>function</code> |  |

<a name="main+close"></a>

### main.close()
close main instance

**Kind**: instance method of [<code>main</code>](#main)  
<a name="main+reload"></a>

### main.reload(callback)
Reload configuration

**Kind**: instance method of [<code>main</code>](#main)  

| Param | Type |
| --- | --- |
| callback | <code>function</code> | 

<a name="main+event_started"></a>

### "started"
Started event

**Kind**: event emitted by [<code>main</code>](#main)  
<a name="main+event_app_loading_error"></a>

### "app_loading_error" (error, node, app, app_config, extra, auto_install)
Application Loading Error

**Kind**: event emitted by [<code>main</code>](#main)  

| Param | Type | Description |
| --- | --- | --- |
| error | <code>object</code> | Error object |
| node | [<code>node</code>](#node) | Node object |
| app | <code>app</code> | Application name |
| app_config | <code>object</code> | Application config |
| extra | <code>\*</code> | Extra information |
| auto_install | <code>boolean</code> | Auto install flag |

<a name="main+event_app_init"></a>

### "app_init" (application)
Application init

**Kind**: event emitted by [<code>main</code>](#main)  

| Param | Type | Description |
| --- | --- | --- |
| application | [<code>application</code>](#application) | Application object |

<a name="main+event_app_added"></a>

### "app_added" (application, application_id)
Application added

**Kind**: event emitted by [<code>main</code>](#main)  

| Param | Type | Description |
| --- | --- | --- |
| application | [<code>application</code>](#application) | Applicaiton name |
| application_id | <code>string</code> | Id |

<a name="node"></a>

## node
Node class

**Kind**: global class  
**Mixes**: [<code>remotecall</code>](#remotecall)  
**Emits**: [<code>create\_new\_node</code>](#router+event_create_new_node)  

* [node](#node)
    * [new node(r, name, parentnode)](#new_node_new)
    * _instance_
        * [.value](#node+value) : <code>\*</code>
        * [.time](#node+time) : <code>timestamp</code>
        * [.metadata](#node+metadata) : <code>object</code>
        * [._config](#node+_config) : <code>object</code>
        * [.node(name)](#node+node) ⇒ [<code>node</code>](#node)
        * [.virtualnode()](#node+virtualnode) ⇒ [<code>node</code>](#node)
        * [.connect_config()](#node+connect_config)
        * [.announce(metadata, update)](#node+announce)
        * [.unannounce()](#node+unannounce)
        * [.publish(time, value, only_if_differ, do_not_add_to_history)](#node+publish)
        * [.subscribe(callback)](#node+subscribe)
        * [.unsubscribe(object)](#node+unsubscribe)
        * [.subscribe_announcement(filter_method, object)](#node+subscribe_announcement)
        * [.unsubscribe_announcement(object)](#node+unsubscribe_announcement)
        * [.ready(filter_method, object)](#node+ready)
        * [.ready_remove(object)](#node+ready_remove)
        * [.is_parentnode(parent)](#node+is_parentnode)
        * [.filter(filter_config, filter_method, object)](#node+filter)
        * [.on_rpc(method, callack)](#node+on_rpc)
        * [.rpc(method, ...args, [callback])](#node+rpc)
        * ["set" (time, value, only_if_differ, do_not_add_to_history)](#node+event_set)
        * ["registerd"](#node+event_registerd)
        * ["unregisterd"](#node+event_unregisterd)
    * _inner_
        * [~subscribeCallback](#node..subscribeCallback) : <code>function</code>

<a name="new_node_new"></a>

### new node(r, name, parentnode)
Create a node instance


| Param | Type | Description |
| --- | --- | --- |
| r | [<code>router</code>](#router) | The router instance |
| name | <code>string</code> | The name of the node |
| parentnode | [<code>node</code>](#node) | The parent node |

<a name="node+value"></a>

### node.value : <code>\*</code>
Value of the node

**Kind**: instance property of [<code>node</code>](#node)  
<a name="node+time"></a>

### node.time : <code>timestamp</code>
Timestamp of the last change

**Kind**: instance property of [<code>node</code>](#node)  
<a name="node+metadata"></a>

### node.metadata : <code>object</code>
Meta data describing the data in the node

**Kind**: instance property of [<code>node</code>](#node)  
<a name="node+_config"></a>

### node.\_config : <code>object</code>
Connected config

**Kind**: instance property of [<code>node</code>](#node)  
<a name="node+node"></a>

### node.node(name) ⇒ [<code>node</code>](#node)
Get a node instance

**Kind**: instance method of [<code>node</code>](#node)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the node |

<a name="node+virtualnode"></a>

### node.virtualnode() ⇒ [<code>node</code>](#node)
Create a virtual node for data handling

**Kind**: instance method of [<code>node</code>](#node)  
<a name="node+connect_config"></a>

### node.connect\_config()
Connect config to a node. Will be announced with to node

**Kind**: instance method of [<code>node</code>](#node)  
<a name="node+announce"></a>

### node.announce(metadata, update)
Announce a node with meta data

**Kind**: instance method of [<code>node</code>](#node)  
**Emits**: [<code>announce</code>](#router+event_announce)  

| Param | Type | Description |
| --- | --- | --- |
| metadata | <code>object</code> | Meta data describing the node |
| update | <code>boolean</code> | (For internal use only!) |

<a name="node+unannounce"></a>

### node.unannounce()
Unannounce a node

**Kind**: instance method of [<code>node</code>](#node)  
<a name="node+publish"></a>

### node.publish(time, value, only_if_differ, do_not_add_to_history)
Asynchronously publish new data in a node. If `undefined` is passed for the timestamp the current time is used. Please do not create timestamps on your own.

Publishing `null` means that we did not get any value (in a longer time).

**Kind**: instance method of [<code>node</code>](#node)  
**Emits**: <code>node#event:registered</code>  
**this**: [<code>node</code>](#node)  

| Param | Type | Description |
| --- | --- | --- |
| time | <code>timestamp</code> | The timestamp |
| value | <code>\*</code> | The value |
| only_if_differ | <code>Boolean</code> | Publish only if value differ from previous value |
| do_not_add_to_history | <code>Boolean</code> | Do not add the value to the history |

**Example**  
```js
node.publish(undefined, 10);
```
<a name="node+subscribe"></a>

### node.subscribe(callback)
Subscribe to the changes of a node

**Kind**: instance method of [<code>node</code>](#node)  
**Emits**: <code>node#event:registered</code>  
**this**: [<code>node</code>](#node)  

| Param | Type | Description |
| --- | --- | --- |
| callback | [<code>subscribeCallback</code>](#node..subscribeCallback) | The function to be called on new data |

**Example**  
```js
var s = node.subscribe(function(do_not_add_to_history, initial) {
	// ...
});
```
<a name="node+unsubscribe"></a>

### node.unsubscribe(object)
Unsubscribe to the changes of a node

**Kind**: instance method of [<code>node</code>](#node)  
**Emits**: <code>node#event:unregistered</code>  

| Param | Type | Description |
| --- | --- | --- |
| object | <code>function</code> | The function to be unsubscribed |

**Example**  
```js
var s = node.subscribe(function(do_not_add_to_history, initial) {
	// ...
});
node.unsubscribe(s);
```
<a name="node+subscribe_announcement"></a>

### node.subscribe\_announcement(filter_method, object)
Subscribe to announcements

**Kind**: instance method of [<code>node</code>](#node)  

| Param | Type | Description |
| --- | --- | --- |
| filter_method | <code>string</code> | Only listen to a specific method [`announce`, `unannounce`, `remove`] (optional) |
| object | <code>function</code> | The function to be called an new announcements |

**Example**  
```js
var s = node.subscribe_announcement(function(snode, method, initial, update) {
	// ...
});
var s = node.subscribe_announcement("announce", function(snode, method, initial, update) {
	// ...
});
```
<a name="node+unsubscribe_announcement"></a>

### node.unsubscribe\_announcement(object)
Unsubscribe announcements

**Kind**: instance method of [<code>node</code>](#node)  

| Param | Type | Description |
| --- | --- | --- |
| object | <code>function</code> | The function to be unsubscribed |

**Example**  
```js
var s = node.subscribe_announcement(function(snode, method, initial, update) {
	// ...
});
node.unsubscribe_announcement(s);
```
<a name="node+ready"></a>

### node.ready(filter_method, object)
Subscribe ready listener

**Kind**: instance method of [<code>node</code>](#node)  

| Param | Type | Description |
| --- | --- | --- |
| filter_method | <code>string</code> | Only listen to a specific method [`announce`, `unannounce`, `remove`] (optional) |
| object | <code>function</code> | The function to be called an ready |

**Example**  
```js
var s = node.ready(function(method, initial, update) {
	// ...
});
var s = node.ready("announce", function(method, initial, update) {
	// ...
});
```
<a name="node+ready_remove"></a>

### node.ready\_remove(object)
Unsubscribe ready listener

**Kind**: instance method of [<code>node</code>](#node)  

| Param | Type | Description |
| --- | --- | --- |
| object | <code>function</code> | The function to be unsubscribed var s = node.ready(function(method, initial, update) { 	// ... }); node.ready_remove(s); |

<a name="node+is_parentnode"></a>

### node.is\_parentnode(parent)
Is parent a parent node of this node?

**Kind**: instance method of [<code>node</code>](#node)  

| Param | Type | Description |
| --- | --- | --- |
| parent | [<code>node</code>](#node) | The parent node |

<a name="node+filter"></a>

### node.filter(filter_config, filter_method, object)
Filter nodes (like subscribe_announcement but with filtering)

**Kind**: instance method of [<code>node</code>](#node)  

| Param | Type | Description |
| --- | --- | --- |
| filter_config | <code>object</code> | An object with the filter configuration |
| filter_method | <code>string</code> | Only listen to a specific method |
| object | <code>function</code> | The function to be called an new announcements |

**Example**  
```js
var s = node.filter([{
	nodes: ["/hello", "/world"],
	depth: 2
},{ // OR
	metadata: {
		"type": "my.app"
	}
}], function(snode, method, initial, update) {
	// ...
});
node.unsubscribe_announcement(s);
```
<a name="node+on_rpc"></a>

### node.on\_rpc(method, callack)
Register a RPC command on the node

**Kind**: instance method of [<code>node</code>](#node)  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | Method to be called |
| callack | <code>function</code> | Function to register |

**Example**  
```js
node.on_rpc("ping", function(reply, text) {
	reply(null, "pong " + text);
});
```
<a name="node+rpc"></a>

### node.rpc(method, ...args, [callback])
Execute a RPC command on the node

**Kind**: instance method of [<code>node</code>](#node)  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | Method to be called |
| ...args | <code>\*</code> | Extra arguments |
| [callback] | <code>function</code> | Callback to get the result |

**Example**  
```js
node.rpc("ping", function(err, data) {
	if (err) {
		return consle.error(err);
	}
	// ..
	console.log(data);
});
```
<a name="node+event_set"></a>

### "set" (time, value, only_if_differ, do_not_add_to_history)
set value event

**Kind**: event emitted by [<code>node</code>](#node)  

| Param | Type |
| --- | --- |
| time | <code>number</code> | 
| value | <code>\*</code> | 
| only_if_differ | <code>boolean</code> | 
| do_not_add_to_history | <code>boolean</code> | 

<a name="node+event_registerd"></a>

### "registerd"
registered subscription event

**Kind**: event emitted by [<code>node</code>](#node)  
<a name="node+event_unregisterd"></a>

### "unregisterd"
unregistered subscription event

**Kind**: event emitted by [<code>node</code>](#node)  
<a name="node..subscribeCallback"></a>

### node~subscribeCallback : <code>function</code>
Callback to be used when subscribing a node

**Kind**: inner typedef of [<code>node</code>](#node)  

| Param | Type | Description |
| --- | --- | --- |
| do_not_add_to_history | <code>boolean</code> | Shall this new entry be added to the history? |
| initial | <code>boolean</code> | Is called initialy? |

<a name="router"></a>

## router
Router class

**Kind**: global class  

* [router](#router)
    * [new router([name])](#new_router_new)
    * [.node(name)](#router+node) ⇒ [<code>node</code>](#node)
    * ["create_new_node"](#router+event_create_new_node)
    * ["announce"](#router+event_announce)

<a name="new_router_new"></a>

### new router([name])
Creates a Router instance


| Param | Type | Description |
| --- | --- | --- |
| [name] | <code>string</code> | The name of the router |

<a name="router+node"></a>

### router.node(name) ⇒ [<code>node</code>](#node)
Get a node instance

**Kind**: instance method of [<code>router</code>](#router)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the node |

<a name="router+event_create_new_node"></a>

### "create_new_node"
Create new node event

**Kind**: event emitted by [<code>router</code>](#router)  
<a name="router+event_announce"></a>

### "announce"
Announce node event

Give others a chance to alter metadata before annoucing it.

**Kind**: event emitted by [<code>router</code>](#router)  
<a name="remotecall"></a>

## *remotecall*
Remote Call class

**Kind**: global abstract class  
<a name="new_remotecall_new"></a>

### *new remotecall()*
Remote Call class

<a name="node_map"></a>

## node\_map
Node-Map class

**Kind**: global class  

* [node_map](#node_map)
    * [new node_map(node, config, [app], [map_extra_elements])](#new_node_map_new)
    * [.init()](#node_map+init)
    * [.node(app_config, [local_metadata], [cache])](#node_map+node)
    * [.unload()](#node_map+unload)
    * [.remove_node(app_config)](#node_map+remove_node)
    * [.map_initialise(n, metadata, app_config)](#node_map+map_initialise)
    * [.map_key(app_config, [cache])](#node_map+map_key)

<a name="new_node_map_new"></a>

### new node\_map(node, config, [app], [map_extra_elements])
Create a node-map


| Param | Type | Description |
| --- | --- | --- |
| node | [<code>node</code>](#node) | A node instance |
| config | <code>object</code> | A config object |
| [app] | <code>string</code> \| [<code>application</code>](#application) \| <code>boolean</code> | An application to map content |
| [map_extra_elements] | <code>boolean</code> \| <code>object</code> \| <code>function</code> | Map extra elements? |

<a name="node_map+init"></a>

### node_map.init()
Initialize config

**Kind**: instance method of [<code>node\_map</code>](#node_map)  
<a name="node_map+node"></a>

### node_map.node(app_config, [local_metadata], [cache])
Map a config object to a node

**Kind**: instance method of [<code>node\_map</code>](#node_map)  

| Param | Type | Description |
| --- | --- | --- |
| app_config | <code>object</code> | A config object |
| [local_metadata] | <code>object</code> | Addional metadata |
| [cache] | <code>\*</code> | Addional object for caching |

<a name="node_map+unload"></a>

### node_map.unload()
Unload all nodes

**Kind**: instance method of [<code>node\_map</code>](#node_map)  
<a name="node_map+remove_node"></a>

### node_map.remove\_node(app_config)
Remove a single node

**Kind**: instance method of [<code>node\_map</code>](#node_map)  

| Param | Type | Description |
| --- | --- | --- |
| app_config | <code>object</code> | A config object |

<a name="node_map+map_initialise"></a>

### node_map.map\_initialise(n, metadata, app_config)
Initialise a new node

**Kind**: instance method of [<code>node\_map</code>](#node_map)  

| Param | Type | Description |
| --- | --- | --- |
| n | [<code>node</code>](#node) | The node to initialse |
| metadata | <code>object</code> | metadata gathered together |
| app_config | <code>object</code> | Mapped or saved config |

<a name="node_map+map_key"></a>

### node_map.map\_key(app_config, [cache])
Map a config object to a string

**Kind**: instance method of [<code>node\_map</code>](#node_map)  

| Param | Type | Description |
| --- | --- | --- |
| app_config | <code>object</code> | A config object |
| [cache] | <code>\*</code> | Addional object for caching |

<a name="application"></a>

## application
Application class

**Kind**: global class  

* [application](#application)
    * [new application(app)](#new_application_new)
    * [.inherit](#application+inherit) : <code>string</code> \| <code>Array.&lt;string&gt;</code>
    * *[.auto_configure(app_config)](#application+auto_configure)*
    * *[.init(app_config, node, main, extra)](#application+init) ⇒ <code>object</code>*
    * *[.unload(object, unload_object)](#application+unload)*
    * *[.reinit(app_config, node, main, extra)](#application+reinit)*
    * *[.cli(args, show_help, main, extra)](#application+cli)*

<a name="new_application_new"></a>

### new application(app)
Osiota can run applications. This is the base class every application
automatically inherits methods and attributes from. An application is
started when the `init()` function is called by osiota. It can `inherit`
methods and attributes from other applications.


| Param | Type | Description |
| --- | --- | --- |
| app | <code>string</code> | Application name |

<a name="application+inherit"></a>

### application.inherit : <code>string</code> \| <code>Array.&lt;string&gt;</code>
List the application names this application shall inherit attributes and methods from. You can use every application name. The application needs to be installed.

**Kind**: instance property of [<code>application</code>](#application)  
**Example**  
```js
exports.inherit = [ "parse-text" ];
```
<a name="application+auto_configure"></a>

### *application.auto\_configure(app_config)*
This method is called before the init function when no configuration
was provided.

**Kind**: instance abstract method of [<code>application</code>](#application)  

| Param | Type | Description |
| --- | --- | --- |
| app_config | <code>object</code> | (The empty) config object |

<a name="application+init"></a>

### *application.init(app_config, node, main, extra) ⇒ <code>object</code>*
Init method

**Kind**: instance abstract method of [<code>application</code>](#application)  
**Returns**: <code>object</code> - A cleaning object  

| Param | Type | Description |
| --- | --- | --- |
| app_config | <code>object</code> | Config object |
| node | [<code>node</code>](#node) | Node object |
| main | [<code>main</code>](#main) | Main instance |
| extra | <code>\*</code> | Extra information |

**Example**  
```js
exports.init = function(node, app_config, main, extra) {
    node.announce({ type: "my.app" });
    node.publish(undefined, 123);

    return node;
};
```
<a name="application+unload"></a>

### *application.unload(object, unload_object)*
Unload method

**Kind**: instance abstract method of [<code>application</code>](#application)  

| Param | Type | Description |
| --- | --- | --- |
| object | <code>Array.&lt;object&gt;</code> | The cleaning object (see init) |
| unload_object | <code>function</code> | Unload object helper function |

<a name="application+reinit"></a>

### *application.reinit(app_config, node, main, extra)*
Reinit method

**Kind**: instance abstract method of [<code>application</code>](#application)  

| Param | Type | Description |
| --- | --- | --- |
| app_config | <code>object</code> | Config object |
| node | [<code>node</code>](#node) | Node object |
| main | [<code>main</code>](#main) | Main instance |
| extra | <code>\*</code> | Extra information |

<a name="application+cli"></a>

### *application.cli(args, show_help, main, extra)*
This method is called from the command line interface (cli) when
`osiota --app myapp` is executed.

**Kind**: instance abstract method of [<code>application</code>](#application)  

| Param | Type | Description |
| --- | --- | --- |
| args | <code>object</code> | Command line arguments |
| show_help | <code>boolean</code> | Show help message |
| main | [<code>main</code>](#main) | Main instance |
| extra | <code>\*</code> | Extra information |

**Example**  
```js
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
	// ...
};
```
<a name="application_manager"></a>

## application\_manager
Application Manager class

**Kind**: global class  

* [application_manager](#application_manager)
    * [new application_manager(main)](#new_application_manager_new)
    * [.find_app(metadata)](#application_manager+find_app) ⇒ <code>string</code>
    * [.schema()](#application_manager+schema) ⇒ <code>object</code>
    * [.get_schema(app)](#application_manager+get_schema) ⇒ <code>object</code>
    * [.list_applications()](#application_manager+list_applications) ⇒ <code>Array.&lt;string&gt;</code>

<a name="new_application_manager_new"></a>

### new application\_manager(main)
Application Manager class


| Param | Type | Description |
| --- | --- | --- |
| main | [<code>main</code>](#main) | Main instance |

<a name="application_manager+find_app"></a>

### application_manager.find\_app(metadata) ⇒ <code>string</code>
Find application by metadata

**Kind**: instance method of [<code>application\_manager</code>](#application_manager)  
**Returns**: <code>string</code> - Application name  

| Param | Type | Description |
| --- | --- | --- |
| metadata | <code>object</code> | Meta data |

<a name="application_manager+schema"></a>

### application_manager.schema() ⇒ <code>object</code>
Load schema of all apps

**Kind**: instance method of [<code>application\_manager</code>](#application_manager)  
**Returns**: <code>object</code> - The JSON schema  
<a name="application_manager+get_schema"></a>

### application_manager.get\_schema(app) ⇒ <code>object</code>
Get schema for app

**Kind**: instance method of [<code>application\_manager</code>](#application_manager)  
**Returns**: <code>object</code> - The JSON schema  

| Param | Type | Description |
| --- | --- | --- |
| app | <code>string</code> | Application name |

<a name="application_manager+list_applications"></a>

### application_manager.list\_applications() ⇒ <code>Array.&lt;string&gt;</code>
List all applications

**Kind**: instance method of [<code>application\_manager</code>](#application_manager)  
**Returns**: <code>Array.&lt;string&gt;</code> - Array with application names.  
