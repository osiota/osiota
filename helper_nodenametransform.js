
exports.nodename_transform = function(nodename, basename_add, basename_remove) {
	if (typeof basename_remove === "string") {
		const regex = new RegExp("^" + RegExp.quote(basename_remove) + "(/.*)?$", '');
		const found = nodename.match(regex);
		if (found) {
			nodename = found[1];
			if (typeof nodename !== "string")
				nodename = "/";
		} else {
			throw new Error("nodename_transform: Basename not found: " + basename_remove + " (node: " + nodename + ")");
		}
	}
	if (typeof basename_add === "string") {
		if (nodename == "/") {
			nodename = basename_add;
		} else {
			nodename = basename_add + nodename;
		}
	}

	return nodename;
}

