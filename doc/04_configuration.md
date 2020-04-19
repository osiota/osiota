# Configuration
An osiota instance is configured by a config file in JSON format. The default name for this file is `osiota.json` (can be set to other names as well, see [INSTALLATION](doc/03_installation.md))

## Example

For example, a config file could look like the following:

```json
{
  "hostname": "Raum 112",
  "remote": [
    {
      "name": "upstream",
      "url": "ws://osiota.local:8080/"
    }
  ],
  "app": [
    {
      "name": "ws-server",
      "config": {
        "server": 8080,
      }
    },
    {
      "name":"dlink-smartplug",
      "config":{
        "hostname": "172.24.1.100",
        "password": "123456",
      }
    }
 ]
}
```

## Options

The config file contains the `hostname` and `server` port which osiota should use, as well as the `remote` connection to other osiota instances that should be established automatically. Furthermore all `app`s, their configuration parameters and all `policies` for the privacy functions are specified here.

### hostname (string)

Set a hostname. Forwarded to remote hosts as name. Upstream instances use this name as prefix for forwarded data resources.

### remote (object)

Connect to a remote ER instance (via WebSockets). To get or forward data from or to another energy-router instance, you can add remotes.

### app (object)

Applications extend the functionality of the energy-router software. Define and configure applications to start.


### auto_install (boolean)

Automatically install new applications.

### policies

todo.

