
RegExp.quote = function(str) {
	    return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
};

// from: http://rosettacode.org/wiki/Averages/Simple_moving_average#JavaScript
function simple_moving_averager(period) {
	var nums = [];
	return function(num) {
		nums.push(num);
		if (nums.length > period)
			nums.splice(0,1);  // remove the first element of the array
		var sum = 0;
		for (var i in nums)
			sum += nums[i];
		var n = period;
		if (nums.length < period)
			n = nums.length;
		return(sum/n);
	}
}

var scope = function (f, scope) {
	return function () {
		return f.apply(scope, arguments);
	};
};
