exports.init = function(router, basename, delay) {
    var i = 0;
    setInterval(function(router, basename) {
        i++;
        if(i === 100)
            i = 0;
        var time = new Date() / 1000;
        router.node(basename).publish(time, i);
    }, delay, router, basename);
};
