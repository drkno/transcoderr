const createForwardingListener = (name, service, socket) => {
    const listener = data => socket.emit(name, data);
    service.on(name, listener);
    socket.once('disconnect', () => service.removeListener(name, listener));
};

module.exports = (io, serviceFactory) => {
    const executorService = serviceFactory.getExecutorService();
    const jobsService = serviceFactory.getJobsService();
    const pluginService = serviceFactory.getPluginService()
    const preferencesService = serviceFactory.getPreferencesService();

    io.on('connection', socket => {
        
        createForwardingListener('job-updated', jobsService, socket);
        createForwardingListener('new-job', jobsService, socket);
    });
};
