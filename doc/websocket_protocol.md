# energy-router: WebSocket protocol

Version: 1.6.0

To be able to connect to the energy router, a WebSocket based JSON RPC interface has been developed.

Clients for NodeJS, JavaScript (for all common web browsers) and MATLAB were implemented.

## Basic communication: WebSocket

The communication is realized with a standard WebSocket connection. Transferred objects are JSON encoded.

Multiple objects can be added to an array and transferred together:

```json
[obj1, obj2, ...]
```

## Structure of the communication: RPC

To send commands (and data with the commands) a two way RPC like interface was defined. The commands and arguments are combined in objects (and encoded as json). For example
```json
{"scope": "global", "type": "function", "args": ["args1", "args2"]}
```
executes the command `rpc_function("args1", "args2")` in the global scope. The attributes of this object have to following meaning:

  * `scope`: Scope where the command i searched.
    * `global`: The default scope is the global scope.
    * ...
  * `type`: Name of the RPC command to be executed.
  * `args`: Array of the arguments to be passed to the RPC command.
  * `ref` (optional): Identifier for response data. If no identifier is set, no response will be send.
  * ... more depending on the scope.

The attribute `scope` and additional attributes (like `node`, see below) define the object on the remote end on which the command shall be executed. On this remote object a function called `rpc_TYPE(ARGS)` depending on the `type` and the `args` is executed.

## RPC responses

The result of a function call is returned in the scope `respond` and is an RPC call as well:

```json
{"scope": "respond", "type": "reply", "args": [ rpc_ref, error, data ]}
```
  * `rpc_ref`: The identifier for the response (see above)
  * `error`: If an error occurred, this value shall contain the error message (an error object can be passed via `data`). Otherwise this attribute shall be `null`.
  * `data`: The returned object.


## General commands (scope: global)

Send a command to router object:
```json
{"scope": "global", "type": command, "ref": UID}
```

### hello(my_name, auth_token, version_string_protocol)

Say hello. Optional pass `my_name`. In later versions this command shall be used for authentication as well.

Response: `remote_name`

### ping()

Answer a ping request.

Response: `"ping"`

### list() --- outdated, do NOT use!

use `subscribe_announcement()`

Get information about all nodes.

```json
{"scope": "global", "type": "list", "ref": UID}
```

Response: `nodes`<br>
Array with node objects, i.e. `[node_obj1, node_obj2, ...]`

A node object has the following fields:
  * `time`: Time of the current data entry.
  * `value`: Data entry.
  * `listener`: Array with routing entries.
    * `type`: "function" or "node"
    * (function) - Call a module.
      * `dest`: Name of the module to route to.
      * `id`: Param for the module.
    * (node) - Route to an other node.
      * `dnode`: Destination node.

### dests() --- outdated, do NOT use!

Get modules.

Response: `destinations`<br>
Array with module names, i.e. `["wss", "wsc", ...]`


## Node commands

To execute commands on the node objects the attribute `node` has to be set.

```json
{"scope": "node", "node": node, "type": command, "args": args, "ref": UID}
```

### subscribe()

Subscribe to changes of this node. Changes are send back via the `data()` RPC call (see below).

Example:
```
{"scope": "node", "node": "/example", "type": "bind"}
```

Response: `"okay"`

### unsubscribe()

Unsubscribe a node.
On connection loss, all nodes are unsubscribed automatically.

Response: `"okay"`

### data(time, value, only_if_differ = false, do_not_add_to_history = false)

Send new data to a node.

Example:
```json
{"scope": "node", "node": "/example", "type": "data", "args": [time, value, only_if_differ, do_not_add_to_history]}
```
(Remember: If no `"ref"` attribute is set, no answer will be send.)

Response: `"okay"`


### subscribe_announcement()

Subscribe the announcements of a node (and its children).
On connection loss, all nodes are unannounced automatically.

Response: `"okay"`

### unsubscribe_announcement()

Unsubscribe the announcements of a node.

Response: `"okay"`

### announce(meta_data)

Announce a new node with meta data. The meta data is describing the data contents of the node.

Response: `"okay"`

### unannounce()

Unannounce a node. This means that the node should be deleted.

Response: `"okay"`

### history(hconfig)

Get historic data of this node. Depends on the history module!

Config: `hconfig`
  * `maxentries`: Maximum amount of the newest entries to be responded. (default: 3000)
  * `fromtime`: Get entries from this time on. An entry with exactly this timestamp is not included.
  * `totime`: Get entries until this time. An entry with exactly this timestamp is not included.
  * `samplerate`: Get data with this sample rate. Zero means the base sample rate.

Response: `hdata`<br>
Array with entries
  * `time`: Unix timestamp of the entry.
  * `value`: Data entry.

## Old node commands, Version 1.5

### connect(destination_node)

Connect this node to a destination node (`destination_node`).

Response: `r_entry`<br>
Identifier of the new routing entry.

### register(dest, id, obj)

Register a module to this node.
  * `dest`: Name of the module.
  * `id`: Param for the module.
  * `obj`: Additional param of custom data.

Response: `r_entry`<br>
Identifier of the new routing entry.

### unregister(r_entry)

Unregister a connection or module. `r_entry` is the identifier for the routing entry (see connect and register).

Response: `"okay"`



## RPC helper methods

There are two helper methods bound to the WebSocket objects:
  * `ws.rpc(method, args..., callback)`
  * `ws.node_rpc(node_name, method, args..., callback)`

To execute a remote method in global scope:
```javascript
ws.rpc("hello", "i_am_an_energy_router", "my-auth-thoken", function(remote_name) {
	console.log("remote name:", data);
});
```

In the scope `node` (with extra param node):
```javascript
ws.node_rpc("/path/to/my/node", "history", function(hdata) {
	console.log("history data:", hdata);
});
```
