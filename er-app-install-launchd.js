const path = require("path");
const fs = require("fs");
const process = require("process");
const helper_config_file = require('./helper_config_file.js');

exports.inherit = [ 'install-systemd' ];

exports.local_service_name = '-launchd.plist';

exports.install_notice = function(service_name, service_filename, service_name,
			service_config) {
	var service_log = service_config.replace(/\.json$/i, "") + ".log";
	console.info('\n' +
		'Choose one of two options:\n' +
                '\n' +
		'Run as agent (runs when user is logged in). Please execute:\n' +
		'# cp "'+service_filename+'" "'+process.env.HOME+'/Library/LaunchAgents/'+service_name+'.plist"\n'+
		'# launchctl load "'+process.env.HOME+'/Library/LaunchAgents/'+service_name+'.plist"\n' +
		'\n' +
                'Run as daemon (runs always. Needs root access). Please execute:\n' +
		'# sudo cp "'+service_filename+'" "/Library/LaunchDaemons/'+service_name+'.plist"\n'+
		'# sudo launchctl load "/Library/LaunchDaemons/'+service_name+'.plist"\n' +
		'\n' +
		'Log will be written to "'+service_log+'"\n' +
		'');

};

exports.create_service_file = function(service_name, service_config,
		service_user, service_workingdir) {
	var command = path.join(__dirname, "osiota.js");
	var service_log = service_config.replace(/\.json$/i, "") + ".log";
	var service_file = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
    <dict>
        <key>Label</key>
        <string>local.${service_name}</string>
	<key>UserName</key>
	<string>${service_user}</string>
        <key>ProgramArguments</key>
        <array>
            <string>${command}</string>
            <string>--config</string>
            <string>${service_config}</string>
            <string>--launchd</string>
        </array>
	<key>EnvironmentVariables</key>
	<dict>
		<key>PATH</key>
		<string>${process.env.PATH}</string>
	</dict>
        <key>WorkingDirectory</key>
        <string>${service_workingdir}</string>
        <key>StandardOutPath</key>
        <string>${service_log}</string>
        <key>StandardErrorPath</key>
        <string>${service_log}</string>
	<key>RunAtLoad</key>
	<true/>
    </dict>
</plist>`;
	return service_file;

};

