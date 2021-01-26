const memoise = supplier => {
    let value = void(0);
    return (...args) => {
        if (value === void(0)) {
            value = supplier(...args);
        }
        return value;
    };
};

module.exports = memoise;
