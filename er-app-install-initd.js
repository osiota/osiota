const path = require("path");
const fs = require("fs");
const helper_config_file = require('./helper_config_file.js');

exports.inherit = [ 'install-systemd' ];

exports.local_service_name = '-initd';

exports.install_notice = function(service_name, service_filename) {
	console.info('\n' +
		'Please execute:\n' +
		'# sudo cp "'+service_filename+'" "/etc/init.d/'+service_name+'"\n'+
		'# sudo chmod 755 "/etc/init.d/'+service_name+'"\n' +
		'# sudo rc-update add '+service_name+' defaults\n' +
		'# sudo /etc/init.d/'+service_name+' start\n' +
		'');

};

exports.create_service_file = function(service_name, service_config,
		service_user, service_workingdir) {
	const command = path.join(__dirname, "osiota.js");
	const service_file = `#!/bin/bash

### BEGIN INIT INFO
# Provides:	     osiota
# Required-Start:    $network $remote_fs $syslog ntp
# Required-Stop:     $network $remote_fs $syslog ntp
# Should-Start:      lighttpd apache2 ethercat
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Start osiota
### END INIT INFO

USR="${service_user}"
cd "${service_workingdir}"

case "$1" in
	'start')
		echo "==== Start"
		sudo -u $USR "${command}" --daemon --config "${service_config}"
		;;
	'stop')
		echo "==== Stop"
		sudo -u $USR "${command}" --stop --config "${service_config}"
		;;
	'restart')
		stop ; echo "Sleeping..."; sleep 1 ;
		start
		;;
	'reload')
		echo "==== Reload"
		sudo -u $USR "${command}" --reload --config "${service_config}"
		;;
	'status')
		echo "==== Status"
		sudo -u $USR "${command}" --status --config "${service_config}"
		;;
	*)
		echo
		echo "Usage: $0 { start | stop | restart | reload | status }"
		echo
		exit 1
		;;
esac

exit 0`;
	return service_file;

};

