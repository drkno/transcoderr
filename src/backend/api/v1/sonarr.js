module.exports = serviceFactory => {
    const executor = serviceFactory.getExecutorService();
    return (req, res) => {
        res.json({});
        const filePath = req.body.episodeFile.path;
        executor.execute(filePath);
    };
};
