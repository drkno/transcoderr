const { join } = require('path');

module.exports = serviceFactory => {
    const executorService = serviceFactory.getExecutorService();
    const directoryService = serviceFactory.getDirectoryService();
    return (req, res) => {
        res.json({});
        
        if (req.body.eventType === 'Grab') {
            LOG.error('The "Grab" Radarr webhook type is not supported.');
            return;
        }
        
        if (req.body.eventType === 'Test') {
            LOG.info('Radarr performed a test against the API');
            return;
        }

        const origPath = join(req.body.movie.folderPath, req.body.movieFile.relativePath);
        const moviePath = directoryService.getRealPath(origPath);
        executorService.execute(moviePath);
    };
};
