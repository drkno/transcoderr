module.exports = serviceFactory => {
    const executor = serviceFactory.getExecutorService();
    return (_, res) => {
        res.json(executor.getJobRecord());
    };
};
