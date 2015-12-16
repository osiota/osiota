/* Media Elements with Actions */

var mea = {};
mea.types = {};

mea.bind = function(name, dom) { };
mea.push = function(name, value, dom) {
	mea.update_dom_element(dom, {value: value});
};

mea.helper_enum_pp = function(list, value) {
	for (var i = 0; i<list.length; i++) {
		if (list[i] == value) {
			return list[(i+1)%list.length];
		}
	}
	return list[0];
};

mea.dom_ready = function(name, $el, type) {
	var dom = $el.get(0);
	if (mea.types.hasOwnProperty(type)) {
		mea.types[type].ready(dom, mea);
	} else {
		console.error("mea type not found: ", type);
	}
	mea.bind(name, dom);

};

// Handlebars: {{live button mybutton1 "Mein Knopf"}}
mea.create = function(parent, type, name, text) {
    	if (typeof(text)==='undefined') text = "";
	if (text == "") {
		text = name.replace(/^.*\//, '');
	}

	var $obj = $("<div/>");
	$obj.appendTo(parent);
	var uri_template = "mediaelements/" + type + ".html";
	//var uri_css = "mediaelements/" + type + ".css"; //undefined;
	//loadtemplate($obj, uri_template, uri_css, data, function($el) {
	$obj.load(uri_template, function() {
		var dom = $(this).children().get(0);
		var $el = $(dom);
		dom.node = name;
		$(dom).find(".name").text(text);
		mea.dom_ready(name, $el, type);
	});
};

mea.action = function(dom, preset_value) {
	var node = dom.node;
	var value = 0;
	if (dom.hasOwnProperty("value")) {
		value = dom.value;
	}
	if (typeof preset_value !== "undefined") {
		value = preset_value;
	}
	
	if (typeof dom.node_type === "undefined" ||
			dom.node_type == "enum") {
		// list ...

		if (value == 0) {
			value = 1;
		} else {
			value = 0;
		}
	} else if (dom.node_type == "range") {
		value = 255 - value;
	}

	//value = exports.helper_enum_pp(list, value);
	console.log("data", node, ":", value);
	//mea.update_dom_element(dom, {value: value});
	mea.push(dom.node, value, dom);
};

mea.update_dom_element = function(dom, data) {
	dom.value = data.value;
	dom.time = data.time;
	if (dom.hasOwnProperty("updatedom") &&
			typeof dom.updatedom === "function") {
		dom.updatedom(data);
	} else {
		$(dom).text(data.value);
	}
};

