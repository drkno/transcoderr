module.exports = serviceFactory => {
    const executor = serviceFactory.getExecutorService();
    return (req, res) => {
        res.json({});

        if (req.body.eventType === 'Test') {
            LOG.info('Sonarr performed a test against the API');
            return;
        }

        const filePath = req.body.episodeFile.path;
        executor.execute(filePath);
    };
};
