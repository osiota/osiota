
mea.types.slider = {};
mea.types.slider.ready = function(dom, mea) {
	dom.action_timeout = null;
	dom.action_time = 0;

	dom.node_type = "range";

	value = 0;
	var slider = jQuery(dom).find(".me_slider_action")[0];
	var s = noUiSlider.create(slider, {
		animate: false,
		start: 255-value,
		step: 1,
		connect: "lower",
		orientation: "vertical",
		range: {
			'min': 0,
			'max': 255
		}
	});
	$(dom).find(".me_slider_reactor").css(
			"height", (1-(value/255))*380);


	slider.noUiSlider.on("slide", function(values) {
		console.log("action", values);
		var avalue = values[0];

		mea.action(dom, avalue);
		dom.action_time = Date.now();

		if (typeof dom.action_timeout == "number") {
			window.clearTimeout(dom.action_timeout);
			dom.action_timeout = null;
		}

	});

	dom.updatedom = function(data) {
		var node = this.node;
		var value = data.value;

		if (value === null) value = 0;

		$(dom).find(".me_slider_reactor").css(
			"height", (1-(value/255))*380);
	
		var slider = jQuery(dom).find(".me_slider_action")[0];

		value = 255-value;
		var lastchanged = dom.action_time;
		var tdiff = Date.now() - lastchanged;
		if (tdiff > 2000) {
			slider.noUiSlider.set([value]);
			dom.action_time = lastchanged-1;
		} else {
			if (typeof dom.action_timeout == "number") {
				window.clearTimeout(dom.action_timeout);
				dom.action_timeout = null;
			}
			dom.action_timeout = window.setTimeout(function() {
				var lastchanged2 = dom.action_time;
				if (lastchanged == lastchanged2) {
					slider.noUiSlider.set([value]);
				}
				dom.action_timeout = null;
			}, 2000);
		}
	};
};

