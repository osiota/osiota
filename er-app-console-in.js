
exports.init = function(node, app_config, main, host_info) {
	const basename = app_config.basename;

	process.stdin.setEncoding('utf8');
	process.stdin.on('readable', function() {
		const chunk = process.stdin.read();
		if (chunk !== null) {
			const str = chunk.toString();
			const lines = str.split(/\r?\n/g);
			for (let i=0; i<lines.length; i++) {
				if (lines[i] != "") {
					const result = lines[i].match(/^([^\[]+)(?:\s+\[([0-9.]+)\])?:\s+([-0-9.]+|undefined)$/);
					if (result) {
						const name = result[1];
						let time = result[2];
						let value = result[3];
						if (value === "undefined") value = null;
						if (typeof time === "string" && time !== "") {
							time = time * 1;
						} else {
							time = undefined;
						}
						node(basename + name).publish(time, value);
					}
				}
			}
		}
	});
};
