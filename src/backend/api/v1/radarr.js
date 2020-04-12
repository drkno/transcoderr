module.exports = serviceFactory => {
    const executor = serviceFactory.getExecutorService();
    return (req, res) => {
        res.json({});
        const filePath = req.body.movieFile.path;
        executor.execute(filePath);
    };
};
