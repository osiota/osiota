const Module = require("module");
const fs = require("fs");
const pa = require("path");
let internalModuleReadFile = process.binding("fs").internalModuleReadFile;
if (!internalModuleReadFile) {
	internalModuleReadFile = fs.readFileSync;
}

// include vm2 if nodejs support it:
let NodeVM;
if (parseInt(process.versions.node.split(".")[0]) >= 6) {
	try {
		NodeVM = require("vm2/lib/main").NodeVM;
	} catch(e) {}
} else {
	console.warn("node.js version is lower than 6: vm2 can not be used.");
}


// from: https://github.com/nodejs/node/blob/master/lib/module.js
const resolveFilename = function(request, parent, isMain) {
	const paths = Module._resolveLookupPaths(request, parent, true);

	const filename = Module._findPath(request, paths, isMain);
	return filename;
};

// from: https://github.com/nodejs/node/blob/master/lib/module.js
const readPackage = function(requestPath) {
	const jsonPath = pa.resolve(requestPath, "package.json");
	let json;
	try {
		json = internalModuleReadFile(pa._makeLong(jsonPath));
	} catch (e) {
		return false;
	}

	if (json === undefined) {
		return false;
	}

	let pkg;
	try {
		pkg = JSON.parse(json);
	} catch (e) {
		e.path = jsonPath;
		e.message = 'Error parsing ' + jsonPath + ': ' + e.message;
		throw e;
	}
	return pkg;
};

const require_vm = function(module_name, paths, use_vm) {
	if (!Array.isArray(module_name)) {
		module_name = [module_name];
	}
	if (typeof use_vm === "undefined") use_vm = true;
	const options = {
		sandbox: {},
		console: "inherit",
		require: {
			external: true,
			builtin: [],
			context: "sandbox",
			root: "./"
		}
	};

	// find module:
	let filename = false;
	paths.some(function(p) {
		module_name.some(function(m) {
			filename = resolveFilename(p + m);
			return filename;
		});
		return filename;
	});
	if (!filename) {
		const err = new Error('Cannot find module "' +
				module_name.join('", "') + '"');
		//err.code = 'MODULE_NOT_FOUND';
		err.code = 'OSIOTA_APP_NOT_FOUND';
		throw err;
	}

	// get dirname
	let dirname = pa.dirname(filename);
	// check package.json (and include native Modules)
	const pkg = readPackage(dirname);
	if (pkg) {
		if (pkg.builtin) {
			options.require.builtin = pkg.builtin;
		}
	}

	// strip dirname after node_modules
	if (dirname.match(/node_modules/)) {
		dirname = dirname.replace(/([\/\\]node_modules).*$/, "$1");
	}

	// set root
	//console.log("root", dirname);
	options.require.root = dirname;

	if (NodeVM && use_vm) {
		// TODO: save in cache!

		// TODO:
		// map node and main to allow individual functions / entries:
		// {
		//	"main": {
		//		"hostname": "r",
		//		"node": "rx",
		//		"add_fkt: "rwx"
		//	}
		// }
		return new NodeVM(options).run(fs.readFileSync(filename, 'utf8'), filename);
	} else {
		return require(filename);
	}
};

/*
// TODO: add unload function:
const module_unload = function(module_name) {
	const name = require.resolve(module_name);
	delete require.cache[name];
};
*/


module.exports = require_vm;
