const debounce = (duration, callback) => {
    let timeout = null;
    return (...args) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            timeout = null;
            callback(...args);
        }, duration);
    };
};

const debounceArgs = (duration, callback) => {
    const debouncers = {};
    return (...args) => {
        const cacheKey = JSON.stringify(args);
        let debouncer = debouncers[cacheKey];
        if (!debouncer) {
            debouncer = debouncers[cacheKey] = debounce(duration, (...params) => {
                delete debouncers[cacheKey];
                callback(...params);
            });
        }
        debouncers[cacheKey](...args);
    };
};

module.exports = {
    debounce,
    debounceArgs
};
