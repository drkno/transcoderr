module.exports = serviceFactory => {
    const executorService = serviceFactory.getExecutorService();
    const directoryService = serviceFactory.getDirectoryService();
    return (req, res) => {
        res.json({});

        if (req.body.eventType === 'Test') {
            LOG.info('Radarr performed a test against the API');
            return;
        }

        const origPath = req.body.movieFile.path;
        const moviePath = directoryService.getRealPath(origPath);
        executorService.execute(moviePath);        
    };
};
