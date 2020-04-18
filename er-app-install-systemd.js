var helper_config_file = require('./helper_config_file.js');
var path = require("path");
var fs = require("fs");

exports.local_service_name = '-systemd.service';

exports.cli = function(argv, show_help) {
	if (show_help) {
		console.group();
		console.info(
			'  --config [file]  Path to the config file\n' +
			'                 (default: "config.json")\n' +
			'  --name [name]  Name and filename of the service\n' +
			'  --user [user]  User to execute the service\n');
		console.groupEnd();
		return;
	}

	// Get full path to config file:
	var service_config = path.resolve(argv.config);
	console.info("Config file:", service_config);

	if (!service_config) {
		throw new Error("Config file not defined.");
	}
	var config = {};
	try {
		config = helper_config_file.read(service_config);
	} catch(err) { }

	var service_name = "osiota";
	if (typeof config.hostname === "string") {
		service_name = config.hostname;
	}
	if (typeof argv.name === "string") {
		service_name = argv.name;
	}
	if (!service_name.match(/^osiota/)) {
		service_name = "osiota-" + service_name;
	}
	service_name = service_name.replace(/ /, '-');
	console.info("Name:", service_name);

	var service_user = process.env.USER;
	if (typeof argv.user === "string") {
		service_user = argv.user;
	}
	console.info("User:", service_user);

	var service_workingdir = process.cwd();
	if (typeof argv.cwd === "string") {
		service_workingdir = path.resolve(argv.cwd);
	}
	console.info("Working dir:", service_workingdir);

	var service_file = this.create_service_file(service_name,
		service_config, service_user, service_workingdir);

	var service_filename = service_config.replace(/.json/i, '') +
			this.local_service_name;
	fs.writeFileSync(service_filename, service_file);
	console.log(service_file);
	this.install_notice(service_name, service_filename);
};

exports.install_notice = function(service_name, service_filename) {
	console.info('\n' +
		'Please execute:\n' +
		'# sudo cp "'+service_filename+'" "/etc/systemd/system/'+service_name+'.service"\n'+
		'# sudo systemctl reload '+service_name+'\n' +
		'# sudo systemctl enable '+service_name+'\n' +
		'# sudo systemctl start '+service_name+'\n' +
		'');

};

exports.create_service_file = function(service_name, service_config,
		service_user, service_workingdir) {
	var command = path.join(__dirname, "osiota.js");
	var service_file = `[Unit]
Description=${service_name}
After=multi-user.target

[Service]
Type=simple
ExecStart=${command} --config "${service_config}"
WorkingDirectory=${service_workingdir}
Restart=on-failure
User=${service_user}

[Install]
WantedBy=multi-user.target
`;
	return service_file;
};
