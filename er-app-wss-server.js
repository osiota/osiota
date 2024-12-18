const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');

exports.inherit = ["ws-server"];

exports.protocolHttp = 'https://';
exports.protocol = 'wss://';


exports.createSelfSignedCert = async function(certPath, keyPath) {
	const { generateKeyPairSync, selfSignedCertificate } = require('crypto');
	const pem = require('pem');
	const createCertificate = promisify(pem.createCertificate);

	const { certificate, serviceKey } = await createCertificate({
		selfSigned: true,
		days: 365 * 20,
		keyBitsize: 2048
	});

	await fs.writeFile(certPath, certificate);
	await fs.writeFile(keyPath, serviceKey);

	console.log('Self-signed certificate created.');
}

exports.create_server = async function(app_config, main) {
	const configFile = main.argv.config || 'osiota.json';
	const configPath = configFile.replace(/\.json/, '');

	// Define paths for the SSL certificate and key
	const certPath = app_config.certPath || configPath + '.cert';
	const keyPath = app_config.keyPath || configPath + '.key';

	// Check if the certificate and key files exist, if not, create them
	try {
		await fs.access(certPath);
		await fs.access(keyPath);
	} catch {
		await this.createSelfSignedCert(certPath, keyPath);
	}

	// Read the SSL certificate and key
	const options = {
		key: await fs.readFile(keyPath),
		cert: await fs.readFile(certPath),
	};

	// Create an HTTPS server
	const server = https.createServer(options,
			this.redirect_page.bind(this, app_config));
	return server;
}

