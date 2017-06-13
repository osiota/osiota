
exports.hash = function(obj) {
	var extra = "";
	if (typeof obj === "object") {
		if (obj === null) return "null";

		if (typeof obj.name === "string") {
			extra += obj.name;
		}
		return (typeof obj) + Object.keys(obj).join("") + extra;
	} else if (typeof obj === "undefined") {
		return "undefined";
	} else {
		return (typeof obj) + obj.toString();
	}
}


exports.merge = function(obj_a, obj_b) {
	if (typeof obj_a === "object" &&
			typeof obj_b === "object") {
		if (Array.isArray(obj_a) || Array.isArray(obj_b)) {
			return merge_array(obj_a, obj_b);
		}
		return merge_object(obj_a, obj_b);
	} else {
		if (obj_a != obj_b) {
			obj_a = obj_b;
		}
	}
	return obj_a;
};

var merge_object = function(obj_a, obj_b) {
	// merge objects:
	for (var k in obj_b) {
		if (obj_b.hasOwnProperty(k)) {
			if (Array.isArray(obj_b[k]) ||
					Array.isArray(obj_a[k])) {
				obj_a[k] = merge_array(obj_a[k], obj_b[k]);
			}
			if (typeof obj_b[k] === "object" &&
					typeof obj_a[k] === "object") {
				obj_a[k] = merge_object(obj_a[k], obj_b[k]);
			} else {
				if (obj_b[k] != obj_a[k]) {
					obj_a[k] = obj_b[k];
				}
			}
		}
	}
	for (var k in obj_a) {
		if (obj_a.hasOwnProperty(k)) {
			if (!obj_b.hasOwnProperty(k)) {
				//todo: unload config
				delete obj_a[k];
			}
		}
	}
	return obj_a;
};


var merge_array = function(obj_a, obj_b) {
	if (!Array.isArray(obj_a)) {
		//todo: unload config
		return obj_b;
	}
	if (!Array.isArray(obj_b)) {
		//todo: unload config
		return obj_b;
	}
	var array = [];
	var i = 0;
	var missing = null;
	obj_a.forEach(function(a) {
		if (exports.hash(a) == exports.hash(obj_b[i])) {
			//console.log(i, "fit");
			array.push(exports.merge(a, obj_b[i]));
			i++;
			//todo: unload config
			missing = null;
		} else if (exports.hash(a) == exports.hash(obj_b[i+1])) {
			if (missing) {
				//console.log(i, "merge");
				array.push(exports.merge(missing, obj_b[i]));
				missing = null;
			} else {
				//console.log(i, "extra");
				array.push(obj_b[i]);
			}
			i++;
			//console.log(i, "fit");
			array.push(a);
			i++;
		} else {
			//console.log(i, "missing => deleting");
			missing = a;
			// do not push.
		}
	});
	for (;i < obj_b.length; i++) {
		//console.log(i, "adding");
		array.push(obj_b[i]);
	}

	return array;
};

