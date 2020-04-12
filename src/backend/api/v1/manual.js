module.exports = serviceFactory => {
    const executor = serviceFactory.getExecutorService();
    return (req, res) => {
        res.json({});
        executor.execute(req.body);
    };
};
