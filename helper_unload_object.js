
exports.unload_object = function(object) {
	var _this = this;
	if (typeof object === "function") {
		if (typeof object.remove === "function") {
			object.remove();
		} else {
			object();
		}
	} else if (typeof object === "object") {
		if (Array.isArray(object)) {
			object.forEach(function(o) {
				exports.unload_object(o);
			});
		// nodejs timers:
		} else if (typeof object.close === "function") {
			object.close();
		// subscribe:
		} else if (typeof object.remove === "function") {
			object.remove();
		// node:
		} else if (typeof object.unannounce === "function") {
			object.unannounce();
		// other app:
		} else if (object !== this &&
				typeof object._unload === "function") {
			object._unload();
		}
	} else if (typeof object === "number") {
		clearTimeout(object);
	}

	return null;
};

