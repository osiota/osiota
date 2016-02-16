exports.init = function(router, basename, delay) {
    var i = 0;
    setInterval(function(router, basename) {
        i++;
        if(i === 100)
            i = 0;
        router.node(basename).publish(undefined, i);
    }, delay, router, basename);
};
