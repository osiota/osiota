mea.ws = null;

mea.bind = function(name, dom) {
	mea.ws.bind(name);

	mea.ws.nodeevent_on(name, function(data, command) {
		mea.update_dom_element(dom, data);
	});
};
mea.push = function(name, value, dom) {
	mea.ws.data(name + "_s", value);
};

