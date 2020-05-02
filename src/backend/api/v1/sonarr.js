const { join } = require('path');

module.exports = serviceFactory => {
    const executorService = serviceFactory.getExecutorService();
    const directoryService = serviceFactory.getDirectoryService();
    return (req, res) => {
        res.json({});

        if (req.body.eventType === 'Test') {
            LOG.info('Sonarr performed a test against the API');
            return;
        }

        const origPath = join(req.body.series.path, req.body.episodeFile.relativePath);
        const episodePath = directoryService.getRealPath(origPath);
        executorService.execute(episodePath);
    };
};
