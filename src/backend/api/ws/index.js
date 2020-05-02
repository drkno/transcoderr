let sequenceNumber = Number.MIN_SAFE_INTEGER;

const createForwardingListener = (name, service, socket) => {
    const listener = data => socket.emit(name, Object.assign({
        _sequenceNumber: sequenceNumber++
    }, data));
    service.on(name, listener);
    socket.once('disconnect', () => service.removeListener(name, listener));
};

module.exports = (io, serviceFactory) => {
    const executorService = serviceFactory.getExecutorService();
    const jobsService = serviceFactory.getJobsService();
    const pluginService = serviceFactory.getPluginService()
    const preferencesService = serviceFactory.getPreferencesService();

    io.on('connection', socket => {
        LOG.info('New websocket connection');
        
        createForwardingListener('job-updated', jobsService, socket);
        createForwardingListener('new-job', jobsService, socket);
    });
};
