<!--

Auto generated documentation:
  * Use jsdoc comments and
  * Run npm run doc

-->
## Classes

<dl>
<dt><a href="#application_loader">application_loader</a></dt>
<dd><p>Application Loader class</p>
</dd>
<dt><a href="#application_manager">application_manager</a></dt>
<dd><p>Application Manager class</p>
</dd>
<dt><a href="#application">application</a></dt>
<dd><p>Application Class</p>
<p>Osiota can run applications. This is the base class every application
automatically inherits methods and attributes from. An application is
started when the <code>init()</code> function is called by osiota. It can <code>inherit</code>
methods and attributes from other applications.</p>
</dd>
<dt><a href="#main">main</a> ⇐ <code>EventEmitter</code></dt>
<dd><p>Main Process Instance</p>
</dd>
<dt><a href="#node_map">node_map</a></dt>
<dd><p>Node-Map class</p>
</dd>
<dt><a href="#node">node</a> ⇐ <code>EventEmitter</code></dt>
<dd><p>Node class</p>
<p>Nodes all exchanging information, either by publish/subscribe or from subscriber to publisher by RPC methods. It can transport any JavaScript data type besides functions.</p>
</dd>
<dt><a href="#router">router</a> ⇐ <code>EventEmitter</code></dt>
<dd><p>Router class</p>
<p>Holdes all node instances</p>
</dd>
</dl>

## Members

<dl>
<dt><a href="#rpcstack">rpcstack</a></dt>
<dd><p>Creates a Remote Call instance</p>
</dd>
</dl>

<a name="application_loader"></a>

## application\_loader
Application Loader class

**Kind**: global class  

* [application_loader](#application_loader)
    * [new application_loader(main)](#new_application_loader_new)
    * [.load(node, apps, callback)](#application_loader+load)
    * [.startup(node, app, app_config, [host_info], [auto_install], [callback])](#application_loader+startup) ⇒ <code>string</code>
    * [.startup_struct(node, struct, [host_info], [auto_install], [callback])](#application_loader+startup_struct) ⇒ <code>string</code>
    * [.close()](#application_loader+close)
    * [.app_reload(app, callback)](#application_loader+app_reload)

<a name="new_application_loader_new"></a>

### new application\_loader(main)
Creates an application loader


| Param | Type | Description |
| --- | --- | --- |
| main | [<code>main</code>](#main) | Main instance |

<a name="application_loader+load"></a>

### application_loader.load(node, apps, callback)
Load applications

**Kind**: instance method of [<code>application\_loader</code>](#application_loader)  

| Param | Type | Description |
| --- | --- | --- |
| node | [<code>node</code>](#node) | Parent node |
| apps | <code>Array.&lt;object&gt;</code> | Application Structs |
| callback | <code>function</code> |  |

<a name="application_loader+startup"></a>

### application_loader.startup(node, app, app_config, [host_info], [auto_install], [callback]) ⇒ <code>string</code>
Startup an application by name and config

**Kind**: instance method of [<code>application\_loader</code>](#application_loader)  
**Returns**: <code>string</code> - Application name  

| Param | Type | Description |
| --- | --- | --- |
| node | [<code>node</code>](#node) | Parent node |
| app | <code>string</code> \| [<code>application</code>](#application) | Application Name or Application |
| app_config | <code>object</code> | Application Config |
| [host_info] | <code>object</code> | Host Information |
| [auto_install] | <code>boolean</code> | Automatic Installation |
| [callback] | <code>function</code> |  |

<a name="application_loader+startup_struct"></a>

### application_loader.startup\_struct(node, struct, [host_info], [auto_install], [callback]) ⇒ <code>string</code>
Startup an application by struct

**Kind**: instance method of [<code>application\_loader</code>](#application_loader)  
**Returns**: <code>string</code> - Application name  

| Param | Type | Description |
| --- | --- | --- |
| node | [<code>node</code>](#node) | Parent node |
| struct | <code>object</code> | Application Struct |
| [host_info] | <code>object</code> | Host Information |
| [auto_install] | <code>boolean</code> | Automatic Installation |
| [callback] | <code>function</code> |  |

<a name="application_loader+close"></a>

### application_loader.close()
Stop all applications

**Kind**: instance method of [<code>application\_loader</code>](#application_loader)  
<a name="application_loader+app_reload"></a>

### application_loader.app\_reload(app, callback)
Reload an app by creating a new app object

**Kind**: instance method of [<code>application\_loader</code>](#application_loader)  

| Param | Type | Description |
| --- | --- | --- |
| app | [<code>application</code>](#application) | Old app instance |
| callback | <code>function</code> | Triggered on loaded app |

**Example**  
```js
app._config.node = "/newnodename";
application_loader.app_reload(app, function(a) {
    app = a;
});
```
<a name="application_manager"></a>

## application\_manager
Application Manager class

**Kind**: global class  

* [application_manager](#application_manager)
    * [new application_manager(main)](#new_application_manager_new)
    * [.find_app(metadata)](#application_manager+find_app) ⇒ <code>string</code>
    * [.app_schema()](#application_manager+app_schema) ⇒ <code>object</code>
    * [.schema()](#application_manager+schema) ⇒ <code>object</code>
    * [.check_config(config)](#application_manager+check_config) ⇒ <code>boolean</code>
    * [.get_schema(app)](#application_manager+get_schema) ⇒ <code>object</code>
    * [.list_applications()](#application_manager+list_applications) ⇒ <code>Array.&lt;string&gt;</code>

<a name="new_application_manager_new"></a>

### new application\_manager(main)
Creates an application manager


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

<a name="application_manager+app_schema"></a>

### application_manager.app\_schema() ⇒ <code>object</code>
Load schema of all apps

**Kind**: instance method of [<code>application\_manager</code>](#application_manager)  
**Returns**: <code>object</code> - The JSON schema  
<a name="application_manager+schema"></a>

### application_manager.schema() ⇒ <code>object</code>
Get full schema

**Kind**: instance method of [<code>application\_manager</code>](#application_manager)  
**Returns**: <code>object</code> - The JSON schema  
<a name="application_manager+check_config"></a>

### application_manager.check\_config(config) ⇒ <code>boolean</code>
Check config object

**Kind**: instance method of [<code>application\_manager</code>](#application_manager)  
**Returns**: <code>boolean</code> - config valid  

| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | Config object |

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
<a name="application"></a>

## application
Application Class

Osiota can run applications. This is the base class every application
automatically inherits methods and attributes from. An application is
started when the `init()` function is called by osiota. It can `inherit`
methods and attributes from other applications.

**Kind**: global class  

* [application](#application)
    * [new application(application_loader, app)](#new_application_new)
    * [.inherit](#application+inherit) : <code>string</code> \| <code>Array.&lt;string&gt;</code>
    * *[.auto_configure(app_config)](#application+auto_configure)*
    * *[.init(app_config, node, main, extra)](#application+init) ⇒ <code>object</code>*
    * *[.unload(object, unload_object)](#application+unload)*
    * *[.reinit(app_config, node, main, extra)](#application+reinit)*
    * *[.cli(args, show_help, main, extra)](#application+cli)*
    * [._reload(callback)](#application+_reload)
    * [._get_app_name()](#application+_get_app_name)

<a name="new_application_new"></a>

### new application(application_loader, app)
Creates an Application


| Param | Type | Description |
| --- | --- | --- |
| application_loader | [<code>application\_loader</code>](#application_loader) | Application Loader instance |
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
			'                 (default: "osiota.json")\n' +
			'  --name [name]  Name and filename of the service\n' +
		console.groupEnd();
		return;
	}
	// ...
};
```
<a name="application+_reload"></a>

### application.\_reload(callback)
Reload an app by creating a new app object

**Kind**: instance method of [<code>application</code>](#application)  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | Triggered on loaded app |

**Example**  
```js
app._config.node = "/newnodename";
app._reload(function(a) {
    app = a;
});
```
<a name="application+_get_app_name"></a>

### application.\_get\_app\_name()
Get Application Name (from Schema)

**Kind**: instance method of [<code>application</code>](#application)  
<a name="main"></a>

## main ⇐ <code>EventEmitter</code>
Main Process Instance

**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [main](#main) ⇐ <code>EventEmitter</code>
    * [new main(router_name)](#new_main_new)
    * [.config(config)](#main+config)
    * [.sub_config(config, node, callback)](#main+sub_config)
    * [.node(name)](#main+node) ⇒ [<code>node</code>](#node)
    * [.close()](#main+close)
    * [.reload(callback)](#main+reload)
    * ["app_loading_error" (error, node, app, app_config, extra, auto_install)](#main+event_app_loading_error)
    * ["app_init" (application)](#main+event_app_init)
    * ["app_added" (application, application_id)](#main+event_app_added)
    * ["started"](#main+event_started)

<a name="new_main_new"></a>

### new main(router_name)
Create a main instance


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

<a name="main+node"></a>

### main.node(name) ⇒ [<code>node</code>](#node)
Get a node instance (format to router instance)

**Kind**: instance method of [<code>main</code>](#main)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the node |

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

**Example**  
```js
main.reload(function(m) {
	main = m;
});
```
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

<a name="main+event_started"></a>

### "started"
Started event

**Kind**: event emitted by [<code>main</code>](#main)  
<a name="node_map"></a>

## node\_map
Node-Map class

**Kind**: global class  

* [node_map](#node_map)
    * [new node_map(node, app_config, [map_settings])](#new_node_map_new)
    * [.init()](#node_map+init)
    * [.node(app_config, [local_metadata], [cache])](#node_map+node) ⇒ [<code>node</code>](#node)
    * [.unload()](#node_map+unload)
    * [.remove_node(app_config)](#node_map+remove_node)
    * [.map_initialise(n, metadata, app_config)](#node_map+map_initialise)
    * [.map_key(app_config, [cache])](#node_map+map_key) ⇒ <code>string</code>
    * [.map_nodename(key, app_config, [local_metadata])](#node_map+map_nodename)
    * [.forEach(callback)](#node_map+forEach)
    * [.on_rpc(name, callback)](#node_map+on_rpc)

<a name="new_node_map_new"></a>

### new node\_map(node, app_config, [map_settings])

| Param | Type | Description |
| --- | --- | --- |
| node | [<code>node</code>](#node) | A node instance |
| app_config | <code>object</code> | A config object |
| [map_settings] | <code>object</code> | A config object |
| [map_settings.app] | <code>string</code> \| [<code>application</code>](#application) \| <code>boolean</code> | An application to map content |
| [map_settings.map_extra_elements] | <code>boolean</code> \| <code>object</code> \| <code>function</code> | Map extra elements? |
| [map_settings.map_key] | <code>function</code> | Map key function |
| [map_settings.map_initialise] | <code>function</code> | Map initialise element |

**Example**  
```js
const map = new main.classes.NodeMap(node, config, {
	"map_key": (app_config)=>{
		return ""+app_config.map;
	},
	"map_initialise": (n, metadata, app_config, reannounce)=>{
		n.rpc_set = function(reply, value, time) { };
		n.announce(metadata, reannounce);
	},
});
map.init();
const on_message = function(item, value) {
	const n = map.node(item);
	if (n) {
		n.publish(undefined, value);
	}
};
```
**Example**  
```js
const map = node.map(app_config, {
	"map_extra_elements": true,
	"map_key": (c)=>{
		const name = c.map;
		return name;
	},
	"map_initialise": (n, metadata, c, reannounce)=>{
		n.rpc_set = function(reply, value, time) { };
		n.announce(metadata, reannounce);
	}
});
const on_message = function(item, value) {
	const n = map.node(item);
	if (n) {
		n.publish(undefined, value);
	}
};
```
<a name="node_map+init"></a>

### node_map.init()
Initialize config

**Kind**: instance method of [<code>node\_map</code>](#node_map)  
<a name="node_map+node"></a>

### node_map.node(app_config, [local_metadata], [cache]) ⇒ [<code>node</code>](#node)
Map a config object to a node

**Kind**: instance method of [<code>node\_map</code>](#node_map)  

| Param | Type | Description |
| --- | --- | --- |
| app_config | <code>object</code> | A config object |
| [local_metadata] | <code>object</code> | Addional meta data |
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
| metadata | <code>object</code> | Meta data gathered together |
| app_config | <code>object</code> | Mapped or saved config |

<a name="node_map+map_key"></a>

### node_map.map\_key(app_config, [cache]) ⇒ <code>string</code>
Map a config object to a string

**Kind**: instance method of [<code>node\_map</code>](#node_map)  
**Returns**: <code>string</code> - Mapped key string  

| Param | Type | Description |
| --- | --- | --- |
| app_config | <code>object</code> | Mapped or saved config |
| [cache] | <code>\*</code> | Addional object for caching |

<a name="node_map+map_nodename"></a>

### node_map.map\_nodename(key, app_config, [local_metadata])
Map nodename

**Kind**: instance method of [<code>node\_map</code>](#node_map)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | String key for mapping |
| app_config | <code>object</code> | Mapped or saved config |
| [local_metadata] | <code>object</code> | Addional meta data |

<a name="node_map+forEach"></a>

### node_map.forEach(callback)
Iterate through nodes of the map

**Kind**: instance method of [<code>node\_map</code>](#node_map)  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | Callback |

**Example**  
```js
map.forEach((node, config)=>{
});
```
<a name="node_map+on_rpc"></a>

### node_map.on\_rpc(name, callback)
Bind a rpc callback to all nodes

**Kind**: instance method of [<code>node\_map</code>](#node_map)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | RPC name |
| callback | <code>function</code> | RPC callback |

**Example**  
```js
exports.init = function(node, app_config) {
    const map = node.map(...);
    const f = map.on_rpc("set", function(value, true) {
        // ...
    });
	       return [f, map]; // automatically removed rpc bindings
}
```
<a name="node"></a>

## node ⇐ <code>EventEmitter</code>
Node class

Nodes all exchanging information, either by publish/subscribe or from subscriber to publisher by RPC methods. It can transport any JavaScript data type besides functions.

**Kind**: global class  
**Extends**: <code>EventEmitter</code>  
**Emits**: [<code>create\_new\_node</code>](#router+event_create_new_node)  

* [node](#node) ⇐ <code>EventEmitter</code>
    * [new node(r, name, parentnode)](#new_node_new)
    * _instance_
        * [.value](#node+value) : <code>\*</code>
        * [.time](#node+time) : <code>timestamp</code>
        * [.metadata](#node+metadata) : <code>object</code>
        * [._config](#node+_config) : <code>object</code>
        * [.node(name)](#node+node) ⇒ [<code>node</code>](#node)
        * [.virtualnode()](#node+virtualnode) ⇒ [<code>node</code>](#node)
        * [.connect_config()](#node+connect_config)
        * [.connect_schema()](#node+connect_schema)
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
        * [.map(app_config, [map_settings])](#node+map)
        * [.on_rpc(method, callback)](#node+on_rpc)
        * [.rpc(method, ...args, [callback])](#node+rpc)
        * [.async_rpc(method, ...args)](#node+async_rpc)
        * [.rpc_cache(method)](#node+rpc_cache) ⇒ <code>function</code>
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
<a name="node+connect_schema"></a>

### node.connect\_schema()
Connect configuration schema to a node. Will be announced with to node

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
<a name="node+map"></a>

### node.map(app_config, [map_settings])
Create a node-map

**Kind**: instance method of [<code>node</code>](#node)  

| Param | Type | Description |
| --- | --- | --- |
| app_config | <code>object</code> | A config object |
| [map_settings] | <code>object</code> | A config object |
| [map_settings.app] | <code>string</code> \| [<code>application</code>](#application) \| <code>boolean</code> | An application to map content |
| [map_settings.map_extra_elements] | <code>boolean</code> \| <code>object</code> \| <code>function</code> | Map extra elements? |
| [map_settings.map_key] | <code>function</code> | Map key function |
| [map_settings.map_initialise] | <code>function</code> | Map initialise element |

**Example**  
```js
var map = node.map(app_config, {
	"map_extra_elements": true,
	"map_key": function(c) {
		var name = c.map;
		return name;
	},
	"map_initialise": function(n, metadata, c) {
		n.rpc_set = function(reply, value, time) { };
		n.announce(metadata);
	}
});
var on_message = function(item, value) {
	var n = map.node(item);
	if (n) {
		n.publish(undefined, value);
	}
};
```
<a name="node+on_rpc"></a>

### node.on\_rpc(method, callback)
Register a RPC command on the node

**Kind**: instance method of [<code>node</code>](#node)  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | Method to be called |
| callback | <code>function</code> | Function to register |

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
<a name="node+async_rpc"></a>

### node.async\_rpc(method, ...args)
Execute a RPC promise command on the node

**Kind**: instance method of [<code>node</code>](#node)  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | Method to be called |
| ...args | <code>\*</code> | Extra arguments |

**Example**  
```js
await node.rpc("ping", 1, 2, 3);
```
<a name="node+rpc_cache"></a>

### node.rpc\_cache(method) ⇒ <code>function</code>
Get a RPC function off the node

**Kind**: instance method of [<code>node</code>](#node)  
**Returns**: <code>function</code> - RPC function  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | Method to be called |

**Example**  
```js
var f = node.rpc_cache("ping");
var result1 = await f(...args);
var result2 = await f(...args);
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

## router ⇐ <code>EventEmitter</code>
Router class

Holdes all node instances

**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [router](#router) ⇐ <code>EventEmitter</code>
    * [new router([name])](#new_router_new)
    * [.node(name)](#router+node) ⇒ [<code>node</code>](#node)
    * ~~[.rpc_list()](#router+rpc_list)~~
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

<a name="router+rpc_list"></a>

### ~~router.rpc\_list()~~
***Deprecated***

RPC function: List current nodes.

Please use subscribe_announcement

**Kind**: instance method of [<code>router</code>](#router)  
<a name="router+event_create_new_node"></a>

### "create_new_node"
Create new node event

**Kind**: event emitted by [<code>router</code>](#router)  
<a name="router+event_announce"></a>

### "announce"
Announce node event

Give others a chance to alter metadata before annoucing it.

**Kind**: event emitted by [<code>router</code>](#router)  
<a name="rpcstack"></a>

## rpcstack
Creates a Remote Call instance

**Kind**: global variable  

* [rpcstack](#rpcstack)
    * [.register_scope(scope, callback)](#rpcstack+register_scope) ⇒ <code>object</code>
    * [.process_single_message(messages, respond, [module])](#rpcstack+process_single_message)
    * [.process_message(messages, [respond], [module])](#rpcstack+process_message)
    * [._rpc_create_object(module, self, args)](#rpcstack+_rpc_create_object) ⇒ <code>object</code>
    * [._rpc_forwarding(obj, reply, node)](#rpcstack+_rpc_forwarding)

<a name="rpcstack+register_scope"></a>

### rpcstack.register\_scope(scope, callback) ⇒ <code>object</code>
Register a scope

**Kind**: instance method of [<code>rpcstack</code>](#rpcstack)  
**Returns**: <code>object</code> - Scope object  

| Param | Type | Description |
| --- | --- | --- |
| scope | <code>string</code> | Name of the scope |
| callback | <code>function</code> | Scope callback to handle the scope |

<a name="rpcstack+process_single_message"></a>

### rpcstack.process\_single\_message(messages, respond, [module])
process a single command message (ie from websocket)

**Kind**: instance method of [<code>rpcstack</code>](#rpcstack)  

| Param | Type | Description |
| --- | --- | --- |
| messages | <code>object</code> | RPC messages (see [WebSocket protocol](websocket_protocol.md)) |
| respond | <code>function</code> | Respond callback |
| [module] | <code>object</code> | Source module |

<a name="rpcstack+process_message"></a>

### rpcstack.process\_message(messages, [respond], [module])
process command messages (ie from websocket)

**Kind**: instance method of [<code>rpcstack</code>](#rpcstack)  

| Param | Type | Description |
| --- | --- | --- |
| messages | <code>Array.&lt;object&gt;</code> | RPC messages (see [WebSocket protocol](websocket_protocol.md)) |
| [respond] | <code>function</code> | Respond callback |
| [module] | <code>object</code> | Source module |

<a name="rpcstack+_rpc_create_object"></a>

### rpcstack.\_rpc\_create\_object(module, self, args) ⇒ <code>object</code>
Create a remote call object

**Kind**: instance method of [<code>rpcstack</code>](#rpcstack)  
**Returns**: <code>object</code> - RPC communication object  

| Param | Type | Description |
| --- | --- | --- |
| module | <code>object</code> | cache object |
| self | <code>object</code> | self object to bind callback to |
| args | <code>object</code> | RPC arguments including callback |

<a name="rpcstack+_rpc_forwarding"></a>

### rpcstack.\_rpc\_forwarding(obj, reply, node)
Forwards a RPC call to a remote host

**Kind**: instance method of [<code>rpcstack</code>](#rpcstack)  

| Param | Type | Description |
| --- | --- | --- |
| obj | <code>object</code> | RPC communication object |
| reply | <code>function</code> | Replay callback |
| node | [<code>node</code>](#node) | Node |

