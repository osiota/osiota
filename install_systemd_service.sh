#!/bin/sh

ER_PATH=`pwd`
ER_CONFIG="config"
ER_NAME="energy-router"
ER_USER="${USER}"

if test \! -f "router.js"
then
	echo "Run this script in the energy-router repo"
	exit 2
fi

if test \! -f "${ER_CONFIG}.json"
then
	echo "Config file not found."
	exit 2
fi

cat <<EOF | sudo tee /etc/systemd/system/${ER_NAME}.service >/dev/null
[Unit]
Description=${ER_NAME}
After=multi-user.target

[Service]
Type=simple
ExecStart=${ER_PATH}/main_cli.js --config "${ER_CONFIG}.json"
Restart=on-failure
User=${ER_USER}

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable "${ER_NAME}"
#systemctl start "${ER_NAME}"

