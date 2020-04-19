## How to install osiota

This tutorial shows how to install and start osiota on a new device.

### Prerequisites

  + osiota can be executed
    + on Linux, Windows, MacOS,
    + on Servers, PCs, Raspberry Pis, and many more.
  + Make sure that [Node.js](http://nodejs.org/) is  installed correctly.
  + Remember that not all applications can be can on every platform.

### Installation

  + Create a directory to hold the configuration and change to it.
  + Install osiota via npm: `npm install osiota`
  
Or use a template repository:
  
```sh
git clone https://github.com/osiota/system-example.git my-system
cd my-system
npm install
```

### Configure automatic startup

1. Recommended: On Linux systems use a systemd script:
    * Run `/path/to/osiota.js --app install-systemd --config path_to_config.json`
    * and follow the instructions


2. On older Linux systems use a init.d script:
    * Run `sudo /path/to/osiota.js --app install-init.d --config path_to_config.json`
    * and follow the instructions
    * Debugging output is written to the file `full_path_to_config.log`


3.	Alternative possibility on Linux and macOS: Use cron: (no root access needed!)
    * Create a user cron task, by opening the crontab via `crontab -e` and
    insert the following line:
    <br>`@reboot	/path/to/osiota.js --config full_path_to_config.json --daemon`
    * To stop, restart or reload this service, use:
    <br/>`/path/to/osiota.js --config full_path_to_config.json --stop` or
    <br/>`/path/to/osiota.js --config full_path_to_config.json --restart` or
    <br/>`/path/to/osiota.js --config full_path_to_config.json --reload`
    * Debugging output is written to the file `full_path_to_config.log`

### Manual startup of osiota for debugging purposes:

Execute `./osiota.js --config path_to_config.json` to start the configuration in `path_to_config.json`. Debugging output is displayed in the console.

See [command line options](command_line_options.md).
