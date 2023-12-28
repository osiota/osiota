/**
 * Application: Perform conditional calculation.
 *
 * Calculation: if (a = b) return true; return undefined;
 */
exports.inherit = ["calculation"];

exports.calculation = function(value) {
	if (value === this._config.value) {
		return true;
	}
	return undefined;
};
