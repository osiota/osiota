const Module = require("module");
const fs = require("fs");
const pa = require("path");
var internalModuleReadFile = process.binding("fs").internalModuleReadFile;
if (!internalModuleReadFile) {
	internalModuleReadFile = fs.readFileSync;
}

// include vm2 if nodejs support it:
if (parseInt(process.versions.node.split(".")[0]) >= 6) {
	try {
		var NodeVM = require("vm2/lib/main").NodeVM;
	} catch(e) {}
} else {
	console.warn("node.js version is lower than 6: vm2 can not be used.");
}


// from: https://github.com/nodejs/node/blob/master/lib/module.js
var resolveFilename = function(request, parent, isMain) {
	var resolvedModule = Module._resolveLookupPaths(request, parent);
	var id = resolvedModule[0];
	var paths = resolvedModule[1];

	var filename = Module._findPath(request, paths, isMain);
	return filename;
};

// from: https://github.com/nodejs/node/blob/master/lib/module.js
var readPackage = function(requestPath) {
	const jsonPath = pa.resolve(requestPath, "package.json");
	try {
		var json = internalModuleReadFile(pa._makeLong(jsonPath));
	} catch (e) {
		return false;
	}

	if (json === undefined) {
		return false;
	}

	try {
		var pkg = JSON.parse(json);
	} catch (e) {
		e.path = jsonPath;
		e.message = 'Error parsing ' + jsonPath + ': ' + e.message;
		throw e;
	}
	return pkg;
};

var require_vm = function(module_name, paths, use_vm) {
	if (typeof use_vm === "undefined") use_vm = true;
	var options = {
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
	var filename = false;
	paths.some(function(p) {
		filename = resolveFilename(p + module_name);
		return filename;
	});
	if (!filename) {
		var err = new Error("Cannot find module '" + module_name + "'");
		//err.code = 'MODULE_NOT_FOUND';
		err.code = 'ER_APP_NOT_FOUND';
		throw err;
	}

	// get dirname
	var dirname = pa.dirname(filename);
	// check package.json (and include native Modules)
	var pkg = readPackage(dirname);
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
var module_unload = function(module_name) {
	var name = require.resolve(module_name);
	delete require.cache[name];
};
*/


module.exports = require_vm;
