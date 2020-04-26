export default apiCall => {
    let promise = null;
    return (...args) => {
        if (promise === null) {
            promise = apiCall.apply(apiCall, ...args);
        }
        return promise;
    };
};
