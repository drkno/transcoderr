let sequenceNumber = Number.MIN_SAFE_INTEGER;

const createForwardingListener = (io, service) => {
    service.on('*', (event, ...args) => {
        io.emit(event, Object.assign({
            _sequenceNumber: sequenceNumber++
        }, args[0]), ...args.slice(1));
    });
};

module.exports = (io, serviceFactory) => {
    createForwardingListener(io, serviceFactory.getExecutorService());
    createForwardingListener(io, serviceFactory.getJobsService());
    createForwardingListener(io, serviceFactory.getPluginService());

    io.on('connection', socket => {
        LOG.info('New websocket connection');
        socket.once('disconnect', () => LOG.info('Websocket disconnected'));
    });
};
