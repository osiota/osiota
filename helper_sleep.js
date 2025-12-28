
function sleep(ms) {
	if (process.env.NODE_ENV === 'test') { ms = ms / 20; }
	return new Promise(resolve=>setTimeout(resolve, ms));
}
exports.sleep = sleep;
