# Configuration
An osiota instance is configured by a config file in JSON format. The default name for this file is `osiota.json` (can be set to other names as well, see [INSTALLATION](installation.md))

A good solution is to commit the configuration file in a git repositoy like in the [system-example repository](https://github.com/osiota/system-example/).



## Example

The following sample configuration file starts two applications. One exposes a server port and the other outputs a string:

```json
{
  "hostname": "Raum 112",
  "app": [
    {
      "name": "ws-server",
      "config": {
        "server": 8080
      }
    },
    {
      "name": "debug-echo",
      "config": {
        "text": "Hello World!"
      }
    }
  ]
}
```


## Global settings

Configuration files consist of global settings and settings that define which applications to load.

Official global settings are:

### hostname (string)

Set a hostname. Forwarded to remote hosts as name. Upstream instances use this name as prefix for forwarded data resources.

## Application settings

The config property `app` constists of array items that define which application to load (`APP_NAME`). Addional settings for the application can be defined as well (`APP_SETTINGS`).

```json
{
  "name": APP_NAME,
  "config": {
    APP_SETTINGS
  }
}
```

### Applications

See on [NPM with search term osiota](https://www.npmjs.com/search?q=osiota). Official osiota apps are situated in the [GitHub group osiota](https://github.com/osiota/).

Some sample apps:

  * [debug-output](https://github.com/osiota/osiota-app-debug-output/)
  * [modbus](https://github.com/osiota/osiota-app-modbus/)
  * [onewire](https://github.com/osiota/osiota-app-onewire/)
  * [onewire-owfs](https://github.com/osiota/osiota-app-onewire-owfs/)


## Samples

Below some configuration samples:

#### Expose a server port to allow other instances to connect

Connect to a remote osiota instance (via WebSockets). To get or forward data from or to another osiota instance, you can add remotes:

`config.app[] =`

```json
    {
      "name": "ws-server",
      "config": {
        "server": 8080
      }
    }
```

#### Connect an instance with an other one

Connect to a remote osiota instance (via WebSockets). To get or forward data from or to another osiota instance, you can add remotes:

`config.app[] =`

```json
    {
      "name": "ws",
      "config": {
        "name": "upstream",
        "url": "ws://osiota.local:8080/"
      }
    }
```


#### Modbus binding

See [app: modbus](https://github.com/osiota/osiota-app-modbus/#configuration-modbus)

`config.app[] =`

```json
    {
      "name": "modbus",
      "config":{
        "connect_type": "RTUBuffered",
        "connect_path": "/dev/ttyUSB0",
        "connect_options": {
          "baudRate": 9600
        },
        "map": [
          {
            "node": "/Lamp Switch",
            "id": 0,
            "address": 10,
            "type": "output boolean",
            "datatype": "boolean",
            "metadata": {
              "power": 60
            }
          }
        ]
      }
    }
```

