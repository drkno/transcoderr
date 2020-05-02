module.exports = serviceFactory => {
    const executor = serviceFactory.getExecutorService();
    return (req, res) => {
        res.json({});

        if (req.body.eventType === 'Test') {
            LOG.info('Radarr performed a test against the API');
            return;
        }

        const filePath = req.body.movieFile.path;
        executor.execute(filePath);
    };
};
