# Add the energy-router to init system

To start the energy-router at system start on a debian/ubuntu system, you have to define the script to start and add a shell script to the init system.

## Define the main script to start

First, you have to define the main script you want to start. In the following example the script ``router_main_relab.js`` is used as script (linked to the file ``router_main_init.js``).
```sh
ln -sf router_main_relab.js router_main_init.js
```

## Add shell script to the init system

To get the defined main script started from the init system, you have to execute the following commands. These commands add the script ``init.d/energy-router`` (use the full path) to the init system dir and add an entry for the energy-router to the init system.
```sh
sudo ln -s /home/user/energy-router/init.d/energy-router /etc/init.d/energy-router
sudo update-rc.d energy-router defaults
```

## Log file

A log file with the name ``er-output.log`` is created in the energy-router main directory containing the console output of your energy-router instance.

