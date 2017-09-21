
exports.unload_object = function(object) {
	if (typeof object === "function") {
		if (typeof object.remove === "function") {
			object.remove();
		} else {
			object(exports.unload_object);
		}
	} else if (typeof object === "object" && object !== null) {
		if (Array.isArray(object)) {
			object.forEach(function(o) {
				exports.unload_object(o);
			});
		// nodejs timers and sockets
		} else if (typeof object.close === "function") {
			try {
				object.close();
			} catch(e) {}
		// some objects:
		} else if (typeof object.destroy === "function") {
			object.destroy();
		// subscribe:
		} else if (typeof object.remove === "function") {
			object.remove();
		// node:
		} else if (typeof object.unannounce === "function") {
			object.unannounce();
		// app:
		} else if (typeof object._unload === "function") {
			object._unload();
		}
	} else if (typeof object === "number") {
		clearTimeout(object);
	}

	return null;
};

