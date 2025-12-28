
function sleep(ms) {
	if (process.env.NODE_ENV === 'test') { ms = ms / 20; }

	let resolve_fn;
	const p = new Promise((resolve) =>{
		resolve_fn = resolve;
	});
	const tid = setTimeout(()=>{
		resolve_fn(true);
	}, ms);

	p.cancel = function() {
		clearTimeout(tid);
		resolve_fn(false);
	};
	p.unref = function() {
		tid.unref();
	};

	return p;
}
exports.sleep = sleep;
