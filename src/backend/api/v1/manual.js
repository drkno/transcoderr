module.exports = serviceFactory => {
    const executorService = serviceFactory.getExecutorService();
    const directoryService = serviceFactory.getDirectoryService();
    return (req, res) => {
        res.json({});
        executorService.execute(req.body.map(file => directoryService.getRealPath(file)));
    };
};
