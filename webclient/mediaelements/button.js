
mea.types.button = {};
mea.types.button.ready = function(dom, mea) {
	jQuery(dom).on("click", "button", function() {
		mea.action(dom);
	});

	dom.updatedom = function(data) {
		var node = this.node;
		$(dom).attr("data-value", data.value);
	};
};

