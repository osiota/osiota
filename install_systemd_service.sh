#!/bin/sh

ER_PATH=`pwd`
ER_CONFIG="config"
ER_NAME="energy-rotuer"
ER_USER="${USER}"

#if test \! -f "main"
#then
#	echo "Run this script in the energy-router repo"
#	exit 2
#fi

cat <<EOF | sudo "cat >/etc/systemd/system/${ER_NAME}.service"
[Unit]
Description=${ER_NAME}
After=multi-user.target

[Service]
Type=simple
ExecStart=${ER_PATH}/main "${ER_CONFIG}"
Restart=on-failure
User=${ER_USER}

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable "${ER_NAME}"
#systemctl start "${ER_NAME}"

